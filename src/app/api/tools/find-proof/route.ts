import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";
import { groqChat, GROQ_COMPOUND_MODEL, GROQ_CHAT_MODEL } from "@/lib/groq";
import { tavilySearch, hasTavily } from "@/lib/tavily";
import { detectHandlesFromUrl } from "@/lib/handle-detect";

/**
 * POST /api/tools/find-proof
 *
 * Given a website URL, ask Claude to search the public web for
 * customer testimonials + praise across X, LinkedIn, Reddit,
 * Product Hunt, HN, App Store, Play Store, and general reviews.
 * Returns a structured summary:
 *
 *   { brand, totalMentions, platforms: [{ name, count }],
 *     topQuotes: [{ content, author, role, source, sourceUrl, score }] }
 *
 * ── Why Claude for this (vs SerpAPI / hand-rolled scraping) ────
 * Claude's web_search tool is server-side — one API call, no
 * separate search vendor, no browser-driver flakiness. Claude
 * plans the queries, reads results, and synthesizes. Same tool
 * we already use for Ask My Wall, so no new integration
 * surface to maintain.
 *
 * Cost: one call is roughly 6-15K tokens through Opus 5 — a few
 * cents. Cache by URL in memory (5-minute TTL) so we don't
 * re-search when someone refreshes.
 *
 * ── Reliability notes ─────────────────────────────────────────
 * - Claude sometimes fabricates author names or roles when the
 *   underlying search snippet was terse. The system prompt is
 *   strict about "only include what's actually in the source"
 *   but expect ~10% noise. Fine for a "wow" surface; not fine
 *   for something users pay for yet.
 * - No mentions found is a real, expected outcome for unknown
 *   brands. We surface it cleanly rather than pretend.
 */

const BODY = z.object({
  url: z.string().min(4).max(500),
  provider: z.enum(["tavily", "groq", "claude"]).optional(),
  // Optional user-provided references — power-user mode. If any
  // of these are set, they take priority over the homepage scrape.
  // twitterHandles: e.g. ["@usetestimoni", "@neha"] — with or
  //   without @, comma-separated on the client, split into array.
  // linkedinUrl: full URL like "https://linkedin.com/company/xyz"
  //   or just "linkedin.com/company/xyz" or a slug.
  // extra: free-text hint — hashtags, alt names, product tagline.
  //   Passed straight to the LLM as extra recognition context.
  twitterHandles: z.array(z.string().max(40)).max(10).optional(),
  linkedinUrl: z.string().max(200).optional(),
  extra: z.string().max(500).optional(),
});

const PlatformSchema = z.object({
  name: z.string(),
  count: z.number().int().min(0),
});

const QuoteSchema = z.object({
  content: z.string(),
  author: z.string(),
  role: z.string().optional(),
  source: z.string(),
  sourceUrl: z.string().optional(),
  score: z.number().int().min(1).max(100),
});

const RESULT_SHAPE = z.object({
  brand: z.string(),
  totalMentions: z.number().int().min(0),
  platforms: z.array(PlatformSchema),
  topQuotes: z.array(QuoteSchema),
});

type Result = z.infer<typeof RESULT_SHAPE>;

// In-memory 24-hour cache keyed on normalized URL. Same URL across
// a day = 1 API charge total. Trims to 500 entries LRU-style.
const CACHE = new Map<string, { at: number; result: Result }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

// Per-IP daily rate limit + global daily spend cap. Both reset at
// midnight (server time). If we exceed the daily cap, the endpoint
// returns 429 with a friendly "come back tomorrow" message.
const IP_LIMIT_PER_DAY = 3;
const DAILY_CALL_CAP = 3; // hard cap on paid Anthropic calls per day (~$0.12 max)
const ipHits = new Map<string, { day: string; count: number }>();
let globalDay = "";
let globalCount = 0;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function ipFrom(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function normalizeUrl(input: string): string | null {
  try {
    const withProto = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const u = new URL(withProto);
    return `${u.protocol}//${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return null;
  }
}

function brandFromUrl(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const parts = host.split(".");
  // "acme.com" → Acme; "app.acme.co" → Acme; "vercel.app" → Vercel.
  const stem = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const normalized = normalizeUrl(body.url);
  if (!normalized) {
    return NextResponse.json(
      { error: "That doesn't look like a valid URL. Try something like acme.com" },
      { status: 400 }
    );
  }

  // Cache hit?
  const cached = CACHE.get(normalized);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached.result, cached: true });
  }

  // Pick provider. Preference order:
  //   1. Explicit body.provider wins.
  //   2. Tavily (free, 1K/mo) if TAVILY_API_KEY + GROQ_API_KEY.
  //   3. Claude (paid, capped) — final fallback.
  //   Note: Groq compound is available but usually 413s on free
  //   tier, so we don't auto-default to it.
  const provider: "tavily" | "groq" | "claude" =
    body.provider ??
    (hasTavily() && process.env.GROQ_API_KEY ? "tavily" : "claude");

  // ── Cost guards (Claude path only) ─────────────────────────
  // Groq compound is free during beta; no per-IP or global cap.
  const ip = ipFrom(req);
  const day = today();
  if (provider === "claude") {
    const hit = ipHits.get(ip);
    if (hit && hit.day === day && hit.count >= IP_LIMIT_PER_DAY) {
      return NextResponse.json(
        {
          error: `You've used your ${IP_LIMIT_PER_DAY} free searches for today. Sign up to keep exploring — it's free.`,
        },
        { status: 429 }
      );
    }
    if (globalDay !== day) {
      globalDay = day;
      globalCount = 0;
    }
    if (globalCount >= DAILY_CALL_CAP) {
      return NextResponse.json(
        {
          error:
            "We've hit today's search limit — come back tomorrow. (This is an experiment; we cap spend to keep it free.)",
        },
        { status: 429 }
      );
    }
  }

  const brand = brandFromUrl(normalized);

  // Two prompt variants:
  //  - fullPrompt: rich rubric, used by Claude (has plenty of context)
  //  - leanPrompt: 60% shorter, used by Groq (compound model's context
  //    budget is tight — the web search results themselves eat ~15K
  //    tokens, and the free tier caps at 30K TPM, so the system
  //    prompt has to be small or we 413/429).
  const leanPrompt = `Find POSITIVE customer mentions of "${brand}" (${normalized}) across X, Reddit, LinkedIn, Product Hunt, Hacker News, App Store, G2, Trustpilot, and blogs. Only real quotes — never invent authors, roles, or content.

Return ONLY this JSON (no prose, no fences):
{"brand":"${brand}","totalMentions":N,"platforms":[{"name":"X","count":N}],"topQuotes":[{"content":"...","author":"name or @handle","role":"optional","source":"X|Reddit|LinkedIn|Product Hunt|Hacker News|App Store|Blog|G2|Trustpilot","sourceUrl":"https://...","score":1-100}]}

Aim for 3-8 topQuotes. If none exist, return "topQuotes":[]. Score by specificity + author credibility + recency.`;

  const fullPrompt = `You are Testimoni's customer-proof discovery engine.

TASK
Given a company's website (${normalized}, brand name likely "${brand}"), search the public web for POSITIVE customer mentions, testimonials, reviews, and praise. Look across:

  - X (Twitter)         — praise tweets, replies, quote tweets
  - LinkedIn            — posts, comments recommending the product
  - Reddit              — subreddit comments, thread replies
  - Product Hunt        — comments on their launch
  - Hacker News         — thread comments
  - App Store / Play    — user reviews (if it's an app)
  - Trustpilot / G2     — review sites
  - Personal blogs      — write-ups mentioning the product

RULES
- Only include POSITIVE mentions. Skip complaints, questions, and clearly neutral mentions.
- Be GENEROUS with small / new / niche brands — if the mention plausibly refers to ${brand} based on context (surrounding words, URLs, hashtags), include it.
- Do NOT invent author names, roles, or quotes. If a name is a handle (like @nikhil), keep the handle.
- Score each quote 1-100 by: specificity (+30), verifiable identity (+25), emotional strength (+20), platform credibility (+15), recency (+10).

OUTPUT — ONLY this JSON, no fences, no commentary:
{"brand":"${brand}","totalMentions":N,"platforms":[{"name":"X","count":N}],"topQuotes":[{"content":"...","author":"...","role":"...","source":"X|LinkedIn|Reddit|Product Hunt|Hacker News|App Store|Blog|G2|Trustpilot","sourceUrl":"...","score":N}]}

Return 3-10 topQuotes. If none, empty array.`;

  let raw = "";
  let effectiveProvider: "tavily" | "groq" | "claude" = provider;

  async function callClaude(): Promise<string> {
    const anthropic = getAnthropic();
    const response = (await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1500,
      system: fullPrompt,
      tools: [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 3,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Find customer proof for the brand "${brand}" (website: ${normalized}). Search now and return the JSON.`,
        },
      ],
    } as unknown as Parameters<typeof anthropic.messages.create>[0])) as unknown as {
      content: Array<{ type: string; text?: string }>;
    };
    let out = "";
    for (const block of response.content) {
      if (block.type === "text" && typeof block.text === "string") out = block.text;
    }
    return out;
  }

  // Tavily + Groq path — free.
  // Search matrix:
  //   1. Broad query — reviews/blogs about the domain
  //   2. Social-domain query — X/Reddit/PH/HN/LinkedIn constrained
  //   3. Handle query (only if we have handles) — targets @mentions
  // Handle discovery: user-supplied fields win. If user gave
  // nothing, we scrape the pasted URL's homepage HTML.
  const normalizedUrl = normalized;

  // Resolve handles once so we can pass them into the LLM prompt
  // regardless of provider. Cheap, ~500ms budget, silent-fail.
  const userTwitter = (body.twitterHandles ?? [])
    .map((h) => h.trim().replace(/^@/, ""))
    .filter(Boolean);
  const userLinkedin = body.linkedinUrl?.trim();
  const userProvidedAny = userTwitter.length > 0 || !!userLinkedin;

  const scraped = userProvidedAny
    ? { twitter: [], linkedin: [], github: [] }
    : await detectHandlesFromUrl(normalizedUrl);

  const twitterHandles = userTwitter.length > 0 ? userTwitter : scraped.twitter;
  const linkedinRefs: string[] = [];
  if (userLinkedin) linkedinRefs.push(userLinkedin);
  linkedinRefs.push(...scraped.linkedin);

  async function callTavilyGroq(): Promise<string> {
    const host = new URL(normalizedUrl).hostname.replace(/^www\./, "");
    const broadQuery = `"${host}" OR "${brand}.com" review "love using" OR "recommend" OR "best tool"`;
    const socialQuery = `"${host}" OR "${brand}"`;

    // If we have Twitter handles, build a handle-focused query.
    // Quoting each handle forces a phrase match on X.
    const handleQuery =
      twitterHandles.length > 0
        ? twitterHandles.map((h) => `"@${h}"`).join(" OR ")
        : null;

    // Fan out searches — up to 3 in parallel.
    const searches: Promise<{ results: Array<{ title: string; url: string; content: string; }> }>[] = [
      tavilySearch({
        query: broadQuery,
        searchDepth: "advanced",
        maxResults: 8,
      }),
      tavilySearch({
        query: socialQuery,
        searchDepth: "advanced",
        maxResults: 8,
        includeDomains: [
          "x.com",
          "twitter.com",
          "reddit.com",
          "producthunt.com",
          "news.ycombinator.com",
          "linkedin.com",
        ],
      }),
    ];
    if (handleQuery) {
      searches.push(
        tavilySearch({
          query: handleQuery,
          searchDepth: "advanced",
          maxResults: 8,
          includeDomains: ["x.com", "twitter.com"],
        })
      );
    }
    const responses = await Promise.all(searches);
    const allResults = responses.flatMap((r) => r.results);

    // Dedupe by URL.
    const seen = new Set<string>();
    const combined = allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Homonym filter — a result survives if it mentions the
    // hostname, one of the known handles, or (for long-stem
    // brands) the stem itself.
    const stemSafe = brand.toLowerCase().length >= 6;
    const needle = host.toLowerCase();
    const stemNeedle = brand.toLowerCase();
    const handleNeedles = twitterHandles.map((h) => h.toLowerCase());
    const merged = combined
      .filter((r) => {
        const hay = `${r.url} ${r.title} ${r.content}`.toLowerCase();
        if (hay.includes(needle)) return true;
        if (handleNeedles.some((h) => hay.includes(h))) return true;
        if (stemSafe && hay.includes(stemNeedle)) return true;
        return false;
      })
      .slice(0, 15);

    if (merged.length === 0) {
      return JSON.stringify({
        brand,
        totalMentions: 0,
        platforms: [],
        topQuotes: [],
      });
    }

    const context = merged
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title}\nURL: ${r.url}\nSNIPPET: ${r.content.slice(0, 500).replace(/\s+/g, " ")}`
      )
      .join("\n\n");

    const synthesisSystem = `You extract POSITIVE customer quotes about a SPECIFIC product from real web search results and return them as strict JSON. Never invent, paraphrase, or synthesize — quotes must appear verbatim in the provided SNIPPETS.

TARGET PRODUCT
  Brand name: ${brand}
  Website:    ${normalizedUrl}
  Hostname:   ${new URL(normalizedUrl).hostname.replace(/^www\./, "")}${
    twitterHandles.length > 0
      ? `\n  X/Twitter: ${twitterHandles.map((h) => `@${h}`).join(", ")}`
      : ""
  }${linkedinRefs.length > 0 ? `\n  LinkedIn:  ${linkedinRefs.join(", ")}` : ""}${
    body.extra ? `\n  Extra:     ${body.extra}` : ""
  }

HOMONYM CHECK — CRITICAL
Some brand names are common words or clash with unrelated products/concepts. Before including a quote:
  1. The snippet must clearly be about the software/company at ${normalizedUrl}, NOT a legal term, a common noun, or a similarly-named unrelated product.
  2. Signals it IS the right product: mentions the hostname, references product features/pricing, links to the site, is in a review site's dedicated page for it.
  3. Signals it is NOT: talks about the word in a generic/dictionary sense; mentions a similarly-named product from a different vertical; is a news article about an unrelated topic that happens to contain the word.
When in doubt, SKIP the snippet.

HARD RULES
1. Copy quotes VERBATIM from the SNIPPET text. Do NOT rewrite, summarize, or "improve" them.
2. NEVER output code, template syntax, brackets like \${...}, or placeholder tokens. If you find yourself wanting to write \${something} or pick(...) or [option1, option2] — you are hallucinating. STOP and pick a different, real quote.
3. If the snippet is a review-site aggregation ("Users praise the software's…"), you MAY include that aggregation verbatim as the quote. Set author to "User review on <site>".
4. If a snippet is a first-person testimonial ("I've been using ${brand}…"), keep it as-is.
5. author = handle/name IF EXPLICITLY VISIBLE in the snippet. Otherwise use "Anonymous" or "User review on <site name>". Never invent a specific person's name.
6. role = only if explicitly stated. Otherwise omit.
7. sourceUrl = the exact URL from the [n] block the quote came from.
8. source = infer from URL:
    twitter.com / x.com → "X"
    reddit.com → "Reddit"
    linkedin.com → "LinkedIn"
    producthunt.com → "Product Hunt"
    news.ycombinator.com → "Hacker News"
    trustpilot.com → "Trustpilot"
    g2.com → "G2"
    other → "Blog"
9. Score 1-100 based on: specificity of outcome (+30), verifiable identity (+25), emotional strength (+20), platform (+15), recency (+10). Default around 55-70.
10. If no positive verbatim quote exists in a snippet that clearly refers to the target product, SKIP it. Better to return 0 real quotes than 5 wrong-product quotes.

OUTPUT — return ONLY this JSON (no fences, no prose):
{"brand":"${brand}","totalMentions":N,"platforms":[{"name":"X","count":N}],"topQuotes":[{"content":"...","author":"...","role":"...","source":"...","sourceUrl":"...","score":N}]}

topQuotes: 0-10 items. Empty array is a valid, honest answer for small/new brands.`;

    const userPrompt = `Extract positive customer proof for the brand "${brand}" from these ${merged.length} real search snippets. VERBATIM ONLY. If a snippet has no clear positive verbatim line, skip it.

SEARCH RESULTS:
${context}

Return the JSON now.`;

    const { text } = await groqChat({
      model: GROQ_CHAT_MODEL,
      max_tokens: 2000,
      messages: [
        { role: "system", content: synthesisSystem },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
    });
    return text;
  }

  try {
    if (provider === "tavily") {
      try {
        raw = await callTavilyGroq();
      } catch (tavilyErr) {
        if (process.env.NODE_ENV === "development") {
          throw tavilyErr;
        }
        console.warn(
          "[find-proof] Tavily+Groq failed, falling back to Claude:",
          tavilyErr
        );
        if (globalDay !== day) {
          globalDay = day;
          globalCount = 0;
        }
        if (globalCount >= DAILY_CALL_CAP) {
          throw tavilyErr;
        }
        raw = await callClaude();
        effectiveProvider = "claude";
      }
    } else if (provider === "groq") {
      try {
        const { text } = await groqChat({
          model: GROQ_COMPOUND_MODEL,
          max_tokens: 1500,
          messages: [
            { role: "system", content: leanPrompt },
            {
              role: "user",
              content: `Search the web for "${brand}" (${normalized}) and return ONLY the JSON.`,
            },
          ],
        });
        raw = text;
      } catch (groqErr) {
        if (process.env.NODE_ENV === "development") {
          throw groqErr;
        }
        console.warn("[find-proof] Groq failed, falling back to Claude:", groqErr);
        if (globalDay !== day) {
          globalDay = day;
          globalCount = 0;
        }
        if (globalCount >= DAILY_CALL_CAP) {
          throw groqErr;
        }
        raw = await callClaude();
        effectiveProvider = "claude";
      }
    } else {
      raw = await callClaude();
    }
  } catch (err) {
    console.error(`[find-proof] ${provider} call failed:`, err);
    return NextResponse.json(
      { error: "Search failed — please try again in a moment.", provider },
      { status: 502 }
    );
  }

  if (!raw) {
    return NextResponse.json(
      { error: "The search didn't return any content — please try again.", provider: effectiveProvider },
      { status: 502 }
    );
  }

  // Strip any accidental markdown fences AND extract a
  // balanced-braces JSON object. Prior versions used
  // firstBrace..lastBrace, which broke when the model
  // emitted a trailing extra `}` (Qwen does this
  // occasionally). Walk brace depth forward to find the
  // true close.
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  let jsonText = stripped;
  const start = stripped.indexOf("{");
  if (start !== -1) {
    let depth = 0;
    let end = -1;
    let inStr = false;
    let esc = false;
    for (let i = start; i < stripped.length; i++) {
      const c = stripped[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) jsonText = stripped.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    console.warn("[find-proof] Model output wasn't valid JSON:", jsonText.slice(0, 300));
    return NextResponse.json(
      { error: "The search results came back garbled — please try again.", provider: effectiveProvider },
      { status: 502 }
    );
  }

  const validated = RESULT_SHAPE.safeParse(parsed);
  if (!validated.success) {
    console.warn("[find-proof] Model output didn't match shape:", validated.error.message);
    return NextResponse.json(
      { error: "The search results came back in an unexpected shape.", provider: effectiveProvider },
      { status: 502 }
    );
  }

  // Defense against LLM hallucination — drop any quote that
  // contains obvious code / template-literal artifacts. Qwen
  // has been observed leaking JavaScript syntax like
  // "${pick(['a','b'])}" into quote content.
  const CODE_ARTIFACT = /\$\{|\bpick\(|\brandom\(|<%|%>|\[\s*['"][^'"]+['"]\s*,/;
  const cleaned = {
    ...validated.data,
    topQuotes: validated.data.topQuotes.filter(
      (q) => !CODE_ARTIFACT.test(q.content) && !CODE_ARTIFACT.test(q.author)
    ),
  };
  const dropped = validated.data.topQuotes.length - cleaned.topQuotes.length;
  if (dropped > 0) {
    console.warn(`[find-proof] Dropped ${dropped} quote(s) containing code artifacts`);
  }

  // LRU-ish cache write.
  if (CACHE.size >= CACHE_MAX) {
    const oldest = CACHE.keys().next().value;
    if (oldest) CACHE.delete(oldest);
  }
  CACHE.set(normalized, { at: Date.now(), result: cleaned });

  // Bump cost-guard counters only when Claude actually served the
  // request (either as the primary provider, or as the Groq-fallback).
  if (effectiveProvider === "claude") {
    const hitNow = ipHits.get(ip);
    if (hitNow && hitNow.day === day) hitNow.count += 1;
    else ipHits.set(ip, { day, count: 1 });
    globalCount += 1;
  }

  return NextResponse.json({ ...cleaned, provider: effectiveProvider });
}
