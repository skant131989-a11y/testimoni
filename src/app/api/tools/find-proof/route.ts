import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";
import { groqChat, GROQ_CHAT_MODEL } from "@/lib/groq";
import { tavilySearch, hasTavily } from "@/lib/tavily";
import { detectHandlesFromUrl } from "@/lib/handle-detect";
import { isOwnBrandUrl, getOwnBrandQuotes } from "@/lib/own-brand-proof";
import {
  resolveScanActor,
  reserveScan,
  refundScan,
  reserveRescue,
  refundRescue,
  peekScanUsage,
  limitMessage,
  RESCUE,
} from "@/lib/scan-limits";
import { getCachedScan, saveCachedScan } from "@/lib/find-proof-cache";

/**
 * POST /api/tools/find-proof
 *
 * Given a website URL, search the public web for real customer praise
 * (X, LinkedIn, Reddit, Product Hunt, Hacker News, app stores, review
 * sites, blogs) and return the quotes it found, each with its source.
 *
 * ── How a scan runs ────────────────────────────────────────────
 *   1. Saved result for this site? Return it. No search, no allowance
 *      used (see lib/find-proof-cache.ts).
 *   2. Otherwise take one scan from the caller's allowance
 *      (lib/scan-limits.ts): 3 a day without an account, 10 a month on
 *      Free, 30 a month on Pro.
 *   3. Tavily finds the real posts and Groq reads them. Pro scans
 *      search more widely (one search per platform).
 *   4. Every quote must appear word for word in the search results or
 *      it is dropped.
 *   5. Last resort only: if that finds nothing and the caller has an
 *      account, Claude runs its own web search (Free: up to 3 quotes,
 *      3 times a month; Pro: up to 10). Each of those quotes must link
 *      to a page Claude's search actually returned. Visitors are asked
 *      to log in for it instead. Capped per day across everyone.
 */

const BODY = z.object({
  url: z.string().min(4).max(500),
  // Optional user-provided references: power-user mode. If any of
  // these are set the result is specific to this request, so it
  // bypasses the shared cache.
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
type Snippet = { title: string; url: string; content: string };
type OutQuote = z.infer<typeof QuoteSchema> & { deep?: boolean };

// Compare URLs ignoring query string, fragment and trailing slash.
function canonUrl(u: string): string {
  try {
    const x = new URL(u);
    return `${x.hostname.replace(/^www\./, "")}${x.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return u.toLowerCase();
  }
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

/** Pull the first balanced {...} object out of a model reply. */
function extractJson(raw: string): string {
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = stripped.indexOf("{");
  if (start === -1) return stripped;
  let depth = 0;
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
      if (depth === 0) return stripped.slice(start, i + 1);
    }
  }
  return stripped;
}

// Case, quote style, emoji and punctuation differences don't matter
// when checking a quote against the search results.
function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A quote is genuine only if its text appears in the search results. */
function isVerbatim(content: string, haystack: string): boolean {
  const parts = content
    .split(/…|\.{3}/)
    .map(normalizeText)
    .filter((p) => p.length >= 12);
  return parts.length > 0 && parts.every((p) => haystack.includes(p));
}

const CODE_ARTIFACT = /\$\{|\bpick\(|\brandom\(|<%|%>|\[\s*['"][^'"]+['"]\s*,/;

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

  const actor = await resolveScanActor(req);
  const isPro = actor.tier === "pro";
  const cacheTier = isPro ? "pro" : "basic";

  // Our own domain: search finds almost nothing for a young brand, so
  // return the real, sourced testimonials from our own wall instead
  // (see lib/own-brand-proof.ts — only ones with a source link).
  // Zero API cost and no allowance used.
  if (isOwnBrandUrl(normalized)) {
    const quotes = await getOwnBrandQuotes();
    if (quotes.length > 0) {
      const byPlatform = new Map<string, number>();
      for (const q of quotes) {
        byPlatform.set(q.source, (byPlatform.get(q.source) ?? 0) + 1);
      }
      return NextResponse.json({
        brand: "Testimoni",
        totalMentions: quotes.length,
        platforms: [...byPlatform.entries()].map(([name, count]) => ({ name, count })),
        topQuotes: quotes,
        provider: "own",
        usage: await peekScanUsage(actor),
      });
    }
  }

  // Saved result? Free for everyone: no search and no allowance used.
  const userTwitter = (body.twitterHandles ?? [])
    .map((h) => h.trim().replace(/^@/, ""))
    .filter(Boolean);
  const userLinkedin = body.linkedinUrl?.trim();
  const customReferences = userTwitter.length > 0 || !!userLinkedin || !!body.extra?.trim();

  if (!customReferences) {
    const saved = await getCachedScan<Result & { provider?: string }>(normalized, cacheTier);
    if (saved) {
      const empty = !saved.topQuotes || saved.topQuotes.length === 0;
      return NextResponse.json({
        ...saved,
        cached: true,
        deepSearch: empty && actor.tier === "visitor" ? "login" : "none",
        usage: await peekScanUsage(actor),
      });
    }
  }

  const canRescue = actor.tier !== "visitor" && !!process.env.ANTHROPIC_API_KEY;
  if (!hasTavily() || !process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Search is temporarily unavailable — please try again later." },
      { status: 503 }
    );
  }

  // A real scan is about to run: take one from the allowance.
  const reservation = await reserveScan(actor);
  if (!reservation.ok) {
    return NextResponse.json(
      {
        error: limitMessage(actor),
        code: "scan_limit",
        usage: reservation.usage,
      },
      { status: 429 }
    );
  }

  const brand = brandFromUrl(normalized);
  const host = new URL(normalized).hostname.replace(/^www\./, "");

  // Handle discovery: user-supplied fields win. If the user gave
  // nothing, scrape the pasted URL's homepage (cheap, silent-fail).
  const scraped = customReferences
    ? { twitter: [] as string[], linkedin: [] as string[], github: [] as string[] }
    : await detectHandlesFromUrl(normalized);
  const twitterHandles = userTwitter.length > 0 ? userTwitter : scraped.twitter;
  const linkedinRefs: string[] = [];
  if (userLinkedin) linkedinRefs.push(userLinkedin);
  linkedinRefs.push(...scraped.linkedin);

  async function gatherSnippets(deep: boolean): Promise<Snippet[]> {
    const broadQuery = `"${host}" OR "${brand}.com" review "love using" OR "recommend" OR "best tool"`;
    const socialQuery = `"${host}" OR "${brand}"`;
    const handleQuery =
      twitterHandles.length > 0 ? twitterHandles.map((h) => `"@${h}"`).join(" OR ") : null;

    const searches = [
      tavilySearch({ query: broadQuery, searchDepth: "advanced", maxResults: 8 }),
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
    if (deep) {
      // Pro: one focused search per platform group, so busy platforms
      // don't crowd out the others.
      const perPlatform: string[][] = [
        ["x.com", "twitter.com"],
        ["reddit.com"],
        ["linkedin.com"],
        ["producthunt.com", "news.ycombinator.com"],
      ];
      for (const domains of perPlatform) {
        searches.push(
          tavilySearch({
            query: socialQuery,
            searchDepth: "advanced",
            maxResults: 10,
            includeDomains: domains,
          })
        );
      }
    }

    const responses = await Promise.all(searches);
    const seen = new Set<string>();
    const combined = responses
      .flatMap((r) => r.results)
      .filter((r) => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });

    // Homonym filter — a result survives if it mentions the hostname,
    // one of the known handles, or (for long-stem brands) the stem.
    const stemSafe = brand.length >= 6;
    const needle = host.toLowerCase();
    const stemNeedle = brand.toLowerCase();
    const handleNeedles = twitterHandles.map((h) => h.toLowerCase());
    return combined
      .filter((r) => {
        const hay = `${r.url} ${r.title} ${r.content}`.toLowerCase();
        if (hay.includes(needle)) return true;
        if (handleNeedles.some((h) => hay.includes(h))) return true;
        if (stemSafe && hay.includes(stemNeedle)) return true;
        return false;
      })
      .slice(0, deep ? 30 : 15);
  }

  const synthesisSystem = `You extract POSITIVE customer quotes about a SPECIFIC product from real web search results and return them as strict JSON. Never invent, paraphrase, or synthesize — quotes must appear verbatim in the provided SNIPPETS.

TARGET PRODUCT
  Brand name: ${brand}
  Website:    ${normalized}
  Hostname:   ${host}${
    twitterHandles.length > 0 ? `\n  X/Twitter: ${twitterHandles.map((h) => `@${h}`).join(", ")}` : ""
  }${linkedinRefs.length > 0 ? `\n  LinkedIn:  ${linkedinRefs.join(", ")}` : ""}${
    body.extra ? `\n  Extra:     ${body.extra}` : ""
  }

HOMONYM CHECK — CRITICAL
Some brand names are common words or clash with unrelated products/concepts. Before including a quote:
  1. The snippet must clearly be about the software/company at ${normalized}, NOT a legal term, a common noun, or a similarly-named unrelated product.
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

topQuotes: 0-${isPro ? 15 : 10} items. Empty array is a valid, honest answer for small/new brands.`;

  /**
   * Last resort: let Claude search the web itself. Claude's own results
   * aren't available to check quotes word for word, so instead every
   * quote must link to a page its search actually returned.
   */
  async function rescueWithClaude(maxQuotes: number): Promise<OutQuote[]> {
    const anthropic = getAnthropic();
    const system = `You are Testimoni's customer-proof discovery engine. Search the public web for POSITIVE customer mentions of the product at ${normalized} (brand likely "${brand}"): praise on X, LinkedIn, Reddit, Product Hunt, Hacker News, app stores, review sites and blogs.

RULES
- Only POSITIVE mentions that are clearly about this product (check the hostname, handles and context; skip homonyms).
- Copy quotes exactly as written on the page. Do NOT invent authors, roles or quotes. Keep @handles as handles; if no name is visible use "Anonymous".
- sourceUrl must be the exact page the quote came from.
- Return at most ${maxQuotes} quotes. If you find none, return an empty topQuotes array.

OUTPUT — ONLY this JSON, no fences, no commentary:
{"brand":"${brand}","totalMentions":N,"platforms":[{"name":"X","count":N}],"topQuotes":[{"content":"...","author":"...","role":"...","source":"X|LinkedIn|Reddit|Product Hunt|Hacker News|App Store|Blog|G2|Trustpilot","sourceUrl":"...","score":N}]}`;
    const response = (await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 2000,
      system,
      tools: [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 3,
          allowed_callers: ["direct"],
        },
      ],
      messages: [
        {
          role: "user",
          content: `Find customer proof for the brand "${brand}" (website: ${normalized}). Search now and return the JSON.`,
        },
      ],
    } as unknown as Parameters<typeof anthropic.messages.create>[0])) as unknown as {
      content: Array<{
        type: string;
        text?: string;
        content?: unknown;
        citations?: Array<{ url?: string }>;
      }>;
    };

    const returned = new Set<string>();
    let text = "";
    for (const block of response.content) {
      if (block.type === "text" && typeof block.text === "string") {
        text = block.text;
        for (const c of block.citations ?? []) if (c.url) returned.add(canonUrl(c.url));
      }
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const r of block.content as Array<{ url?: string }>) {
          if (r.url) returned.add(canonUrl(r.url));
        }
      }
    }
    if (!text) return [];

    const checked = RESULT_SHAPE.safeParse(JSON.parse(extractJson(text)));
    if (!checked.success) return [];
    return checked.data.topQuotes
      .filter(
        (q) =>
          !!q.sourceUrl &&
          returned.has(canonUrl(q.sourceUrl)) &&
          !CODE_ARTIFACT.test(q.content) &&
          !CODE_ARTIFACT.test(q.author)
      )
      .slice(0, maxQuotes)
      .map((q) => ({ ...q, deep: true }));
  }

  async function readWithGroq(system: string, user: string): Promise<string> {
    const { text } = await groqChat({
      model: GROQ_CHAT_MODEL,
      max_tokens: 2000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
    });
    return text;
  }

  const provider = "tavily";
  let raw = "";
  let snippets: Snippet[] = [];

  try {
    snippets = await gatherSnippets(isPro);

    if (snippets.length === 0) {
      raw = JSON.stringify({ brand, totalMentions: 0, platforms: [], topQuotes: [] });
    } else {
      const context = snippets
        .map(
          (r, i) =>
            `[${i + 1}] ${r.title}\nURL: ${r.url}\nSNIPPET: ${r.content.slice(0, 500).replace(/\s+/g, " ")}`
        )
        .join("\n\n");
      const userPrompt = `Extract positive customer proof for the brand "${brand}" from these ${snippets.length} real search snippets. VERBATIM ONLY. If a snippet has no clear positive verbatim line, skip it.

SEARCH RESULTS:
${context}

Return the JSON now.`;

      raw = await readWithGroq(synthesisSystem, userPrompt);
    }
  } catch (err) {
    console.error("[find-proof] search failed:", err);
    await refundScan(actor);
    return NextResponse.json(
      { error: "Search failed — please try again in a moment." },
      { status: 502 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    console.warn("[find-proof] Model output wasn't valid JSON:", raw.slice(0, 300));
    await refundScan(actor);
    return NextResponse.json(
      { error: "The search results came back garbled — please try again." },
      { status: 502 }
    );
  }

  const validated = RESULT_SHAPE.safeParse(parsed);
  if (!validated.success) {
    console.warn("[find-proof] Model output didn't match shape:", validated.error.message);
    await refundScan(actor);
    return NextResponse.json(
      { error: "The search results came back in an unexpected shape." },
      { status: 502 }
    );
  }

  // Keep only quotes that really appear in the search results, and drop
  // any with code artifacts a model sometimes leaks into its output.
  const haystack = normalizeText(snippets.map((s) => `${s.title} ${s.content}`).join(" "));
  const kept = validated.data.topQuotes.filter(
    (q) =>
      !CODE_ARTIFACT.test(q.content) &&
      !CODE_ARTIFACT.test(q.author) &&
      isVerbatim(q.content, haystack)
  );
  const dropped = validated.data.topQuotes.length - kept.length;
  if (dropped > 0) {
    console.warn(`[find-proof] Dropped ${dropped} quote(s) not found verbatim in the results`);
  }

  const byPlatform = new Map<string, number>();
  for (const q of kept) byPlatform.set(q.source, (byPlatform.get(q.source) ?? 0) + 1);
  const result: Omit<Result, "topQuotes"> & { topQuotes: OutQuote[]; provider: string } = {
    brand: validated.data.brand,
    totalMentions: Math.max(validated.data.totalMentions, kept.length),
    platforms: [...byPlatform.entries()].map(([name, count]) => ({ name, count })),
    topQuotes: kept,
    provider,
  };

  // Nothing found: visitors are invited to log in for a deeper search;
  // accounts get one Claude backup search if the limits allow.
  let deepSearch: "none" | "login" | "used" = "none";
  if (kept.length === 0) {
    if (actor.tier === "visitor") {
      deepSearch = "login";
    } else if (canRescue) {
      const slot = await reserveRescue(actor);
      if (slot === "user_limit") {
        deepSearch = "used";
      } else if (slot === "ok") {
        try {
          const maxQuotes = isPro ? RESCUE.maxQuotes.pro : RESCUE.maxQuotes.free;
          const found = await rescueWithClaude(maxQuotes);
          if (found.length > 0) {
            const byDeep = new Map<string, number>();
            for (const q of found) byDeep.set(q.source, (byDeep.get(q.source) ?? 0) + 1);
            result.topQuotes = found;
            result.totalMentions = found.length;
            result.platforms = [...byDeep.entries()].map(([name, count]) => ({ name, count }));
            result.provider = "tavily+claude";
          }
        } catch (err) {
          console.warn("[find-proof] Claude backup search failed:", err);
          await refundRescue(actor);
        }
      }
    }
  }

  // A visitor's empty result isn't saved: an account asking about the
  // same site later should still get the backup search.
  if (!customReferences && deepSearch !== "login") {
    await saveCachedScan(normalized, cacheTier, result);
  }

  return NextResponse.json({ ...result, deepSearch, usage: reservation.usage });
}
