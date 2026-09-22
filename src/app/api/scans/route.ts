import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";
import { groqChat, GROQ_CHAT_MODEL } from "@/lib/groq";
import { tavilySearch, hasTavily } from "@/lib/tavily";
import { detectHandlesFromUrl } from "@/lib/handle-detect";
import { checkAndIncrement } from "@/lib/ask-rate-limit";
import {
  buildTeaser,
  countByCategory,
  type ScanMention,
  type ScanResult,
  type ScanSummary,
} from "@/lib/scan-report";

/**
 * POST /api/scans
 *
 * Given a website URL, discover PUBLIC customer mentions of every
 * kind (not just praise — see "Find My Proof" at
 * /api/tools/find-proof for the positive-only tool this is built
 * next to, untouched) and classify each into one or more of seven
 * categories (a mention can be both praise and an outcome, etc).
 * Returns the free teaser view (see src/lib/scan-report.ts for the
 * gating rule) — the Quick/Deep report is only ever served from
 * GET /api/scans/[id] or POST /verify with a paid unlock token.
 *
 * Same two-tier provider strategy as Find My Proof:
 *   - Tavily search + Groq classification — cheap, primary path.
 *   - Claude web_search — fallback when Tavily is unavailable or
 *     the primary path comes back with zero mentions. Capped
 *     globally (CLAUDE_FALLBACK_DAILY_CAP) since it's a much
 *     costlier tool-use call than the plain summary below.
 *
 * One extra call beyond Find My Proof: after mentions are
 * classified, a single Claude call (CHAT_MODEL, no tools) writes the
 * polished 4-line summary. This is the one call worth paying for
 * Claude-quality prose — it's what a visitor reads first and what
 * drives the $9 unlock decision. It only runs once per *new* scan;
 * cached scans (24h TTL, keyed by normalized URL) skip discovery,
 * classification, and summary entirely.
 */

const BODY = z.object({
  url: z.string().min(4).max(500),
  twitterHandles: z.array(z.string().max(40)).max(10).optional(),
  linkedinUrl: z.string().max(200).optional(),
  extra: z.string().max(500).optional(),
});

const CATEGORY_ENUM = z.enum([
  "praise",
  "complaint",
  "feature_request",
  "use_case",
  "testimonial",
  "outcome",
  "competitor_mention",
]);

const MentionSchema = z.object({
  content: z.string(),
  author: z.string(),
  role: z.string().optional(),
  source: z.string(),
  sourceUrl: z.string().optional(),
  categories: z.array(CATEGORY_ENUM).min(1),
  score: z.number().int().min(1).max(100),
  date: z.string().optional(),
  competitorName: z.string().optional(),
});

const DISCOVERY_SHAPE = z.object({
  brand: z.string(),
  mentions: z.array(MentionSchema),
});

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Global daily cap on the costly Claude web_search fallback path
// only — the cheap Groq classification and the plain-text Claude
// summary call aren't capped here; scan creation itself is already
// throttled per-IP below, and cached scans skip all of this.
const CLAUDE_FALLBACK_DAILY_CAP = Number(
  process.env.SCAN_CLAUDE_FALLBACK_DAILY_CAP || 50
);
let fallbackDay = "";
let fallbackCount = 0;

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
  const stem = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

function extractJsonObject(raw: string): string {
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = stripped.indexOf("{");
  if (start === -1) return stripped;
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
  return end !== -1 ? stripped.slice(start, end + 1) : stripped;
}

// Defense against LLM hallucination — same guard as Find My Proof.
const CODE_ARTIFACT = /\$\{|\bpick\(|\brandom\(|<%|%>|\[\s*['"][^'"]+['"]\s*,/;

function cleanMentions(mentions: ScanMention[]): ScanMention[] {
  const seen = new Set<string>();
  return mentions.filter((m) => {
    if (CODE_ARTIFACT.test(m.content) || CODE_ARTIFACT.test(m.author)) return false;
    const key = m.sourceUrl || `${m.source}:${m.content}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const CLASSIFY_RULES = `CATEGORIES — a quote can belong to MORE THAN ONE category. List every category that genuinely applies, not just the first match:
  praise            — general positive sentiment, doesn't need a concrete outcome
  testimonial       — a fuller, quotable endorsement with a specific outcome/result (display-ready)
  complaint         — frustration, a bug, something that didn't work, dissatisfaction
  feature_request   — an explicit ask for something the product doesn't do yet
  use_case          — a description of how someone actually uses the product (sentiment-neutral is fine)
  outcome           — a MEASURABLE result: saved time, increased revenue, replaced another tool, improved productivity, reduced effort. Often overlaps with praise/testimonial — tag both when true.
  competitor_mention — compares the product to a named competitor, or mentions switching to/from one. When you use this category, ALSO set competitorName to the other product's name.

HOMONYM CHECK — CRITICAL
Some brand names are common words or clash with unrelated products. Before including a quote, confirm it's clearly about THIS product (mentions the hostname, references real features/pricing, links to the site) and not a generic/dictionary use of the word or a different product. When in doubt, SKIP it.

HARD RULES
1. Copy quotes VERBATIM from the snippet. Never rewrite, summarize, or invent.
2. Never output code/template syntax like \${...}, pick(...), or array literals as quote content — if tempted, you're hallucinating; skip that snippet instead.
3. author = the real handle/name if explicitly visible, else "Anonymous" or "User review on <site>". Never invent a specific person.
4. role = only if explicitly stated, otherwise omit.
5. sourceUrl = the exact URL the quote came from. source = infer from the URL (X, Reddit, LinkedIn, Product Hunt, Hacker News, Trustpilot, G2, Blog).
6. date = only if a specific date/timestamp is visibly stated in the snippet. Never estimate or invent one — omit if unsure.
7. competitorName = only present when categories includes competitor_mention; the other product's actual name, never invented.
8. score 1-100: specificity (+30), verifiable identity (+25), emotional/informational strength (+20), platform credibility (+15), recency (+10).
9. If no snippet clearly refers to the target product, return an empty mentions array. Zero honest results beats fabricated ones.`;

async function classifyWithGroq(
  brand: string,
  normalizedUrl: string,
  twitterHandles: string[],
  linkedinRefs: string[],
  extra: string | undefined,
  snippets: Array<{ title: string; url: string; content: string }>
): Promise<{ brand: string; mentions: ScanMention[] } | null> {
  if (snippets.length === 0) return { brand, mentions: [] };

  const context = snippets
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\nSNIPPET: ${r.content.slice(0, 500).replace(/\s+/g, " ")}`
    )
    .join("\n\n");

  const system = `You extract every REAL customer mention of a SPECIFIC product from web search results and classify each into a category. Never invent, paraphrase, or synthesize — quotes must appear verbatim in the provided SNIPPETS.

TARGET PRODUCT
  Brand name: ${brand}
  Website:    ${normalizedUrl}
  Hostname:   ${new URL(normalizedUrl).hostname.replace(/^www\./, "")}${
    twitterHandles.length > 0
      ? `\n  X/Twitter: ${twitterHandles.map((h) => `@${h}`).join(", ")}`
      : ""
  }${linkedinRefs.length > 0 ? `\n  LinkedIn:  ${linkedinRefs.join(", ")}` : ""}${
    extra ? `\n  Extra:     ${extra}` : ""
  }

${CLASSIFY_RULES}

OUTPUT — return ONLY this JSON (no fences, no prose):
{"brand":"${brand}","mentions":[{"content":"...","author":"...","role":"...","source":"...","sourceUrl":"...","categories":["praise"],"score":N,"date":"...","competitorName":"..."}]}
categories is an array — include every category that applies. date and competitorName are optional, omit when not applicable.`;

  const { text } = await groqChat({
    model: GROQ_CHAT_MODEL,
    max_tokens: 2500,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Extract and classify every real customer mention of "${brand}" from these ${snippets.length} search snippets. VERBATIM ONLY.\n\nSEARCH RESULTS:\n${context}\n\nReturn the JSON now.`,
      },
    ],
    temperature: 0,
  });

  const parsed = DISCOVERY_SHAPE.safeParse(JSON.parse(extractJsonObject(text)));
  if (!parsed.success) return null;
  return parsed.data as { brand: string; mentions: ScanMention[] };
}

async function classifyWithClaude(
  brand: string,
  normalizedUrl: string
): Promise<{ brand: string; mentions: ScanMention[] } | null> {
  const anthropic = getAnthropic();
  const system = `You are Testimoni's customer-voice discovery engine. Given a company's website, search the public web (X, LinkedIn, Reddit, Product Hunt, Hacker News, app stores, review sites, blogs) for every real customer mention — praise, complaints, feature requests, use-case descriptions, testimonials, and competitor comparisons — and classify each.

${CLASSIFY_RULES}

Search first, then respond. Your FINAL message must contain ONLY this JSON — no "Based on my search..." preamble, no explanation before or after, no markdown fences:
{"brand":"${brand}","mentions":[{"content":"...","author":"...","role":"...","source":"...","sourceUrl":"...","categories":["praise"],"score":N,"date":"...","competitorName":"..."}]}
categories is an array — include every category that applies. date and competitorName are optional, omit when not applicable. If you found nothing, still return the JSON with an empty mentions array — never explain in prose instead.`;

  const response = (await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 4000,
    system,
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 4,
        allowed_callers: ["direct"],
      },
    ],
    messages: [
      {
        role: "user",
        content: `Find and classify customer mentions for the brand "${brand}" (website: ${normalizedUrl}). Search now and return the JSON.`,
      },
    ],
  } as unknown as Parameters<typeof anthropic.messages.create>[0])) as unknown as {
    content: Array<{ type: string; text?: string }>;
  };

  let out = "";
  for (const block of response.content) {
    if (block.type === "text" && typeof block.text === "string") out = block.text;
  }
  if (!out) return null;
  const parsed = DISCOVERY_SHAPE.safeParse(JSON.parse(extractJsonObject(out)));
  if (!parsed.success) return null;
  return parsed.data as { brand: string; mentions: ScanMention[] };
}

async function summarizeWithClaude(
  brand: string,
  mentions: ScanMention[]
): Promise<ScanSummary> {
  const fallback: ScanSummary = {
    loves: mentions.some((m) => m.categories.includes("praise") || m.categories.includes("testimonial"))
      ? "Customers mention several things they like — see the evidence below."
      : "Not enough praise mentions yet to summarize a pattern.",
    dislikes: mentions.some((m) => m.categories.includes("complaint"))
      ? "A handful of complaints showed up — see the evidence below."
      : "No recurring complaints found in public mentions.",
    requests: mentions.some((m) => m.categories.includes("feature_request"))
      ? "A few feature requests came up — see the evidence below."
      : "No explicit feature requests found in public mentions.",
    howDescribed: `${brand} is discussed across ${new Set(mentions.map((m) => m.source)).size || 0} public source(s).`,
    whyChosen: mentions.some((m) => m.categories.includes("outcome") || m.categories.includes("testimonial"))
      ? "Customers cite specific outcomes — see the evidence below."
      : "Not enough evidence yet to summarize why customers pick it.",
  };

  if (!process.env.ANTHROPIC_API_KEY || mentions.length === 0) return fallback;

  try {
    const anthropic = getAnthropic();
    const digest = mentions
      .slice(0, 60)
      .map((m) => `[${m.categories.join("+")}] "${m.content}" — ${m.author} (${m.source})`)
      .join("\n");

    const response = (await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 700,
      system: `You write a short, specific customer-voice summary from a set of already-classified real customer quotes about "${brand}". Base every sentence only on the quotes given — never invent a pattern that isn't backed by at least one quote. If a category has no quotes, say so honestly instead of padding. Keep each field to 1 sentence, concrete (name the specific thing customers mention, not generic praise).

OUTPUT — ONLY this JSON, no fences:
{"loves":"...","dislikes":"...","requests":"...","howDescribed":"...","whyChosen":"..."}
whyChosen = the recurring reason(s) customers say they picked or kept this product, grounded in the outcome/testimonial quotes.`,
      messages: [
        {
          role: "user",
          content: `Quotes about ${brand}:\n\n${digest}\n\nReturn the JSON summary now.`,
        },
      ],
    } as unknown as Parameters<typeof anthropic.messages.create>[0])) as unknown as {
      content: Array<{ type: string; text?: string }>;
    };

    let out = "";
    for (const block of response.content) {
      if (block.type === "text" && typeof block.text === "string") out = block.text;
    }
    if (!out) return fallback;
    const parsed = z
      .object({
        loves: z.string(),
        dislikes: z.string(),
        requests: z.string(),
        howDescribed: z.string(),
        whyChosen: z.string(),
      })
      .safeParse(JSON.parse(extractJsonObject(out)));
    return parsed.success ? parsed.data : fallback;
  } catch (err) {
    console.warn("[scans] Claude summary failed, using fallback:", err);
    return fallback;
  }
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

  // Cache hit — return the teaser instantly, no API cost, and no
  // rate-limit charge. Checked before the rate limit so re-checking
  // a domain you already scanned today never burns quota — only a
  // genuinely new discovery run below does that.
  const cached = await prisma.urlScan.findUnique({ where: { normalizedUrl: normalized } });
  if (cached && Date.now() - cached.refreshedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({
      id: cached.id,
      ...buildTeaser(cached.resultJson as unknown as ScanResult),
      cached: true,
    });
  }

  const ip = ipFrom(req);
  const rate = checkAndIncrement("scan-create", ip, 5);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "You've used today's free scans.",
        signupUrl: "/signup?src=customer_voice_rate_limit",
      },
      { status: 429 }
    );
  }

  const brand = brandFromUrl(normalized);
  const userTwitter = (body.twitterHandles ?? [])
    .map((h) => h.trim().replace(/^@/, ""))
    .filter(Boolean);
  const userLinkedin = body.linkedinUrl?.trim();
  const userProvidedAny = userTwitter.length > 0 || !!userLinkedin;
  const scraped = userProvidedAny
    ? { twitter: [], linkedin: [], github: [] }
    : await detectHandlesFromUrl(normalized);
  const twitterHandles = userTwitter.length > 0 ? userTwitter : scraped.twitter;
  const linkedinRefs: string[] = [];
  if (userLinkedin) linkedinRefs.push(userLinkedin);
  linkedinRefs.push(...scraped.linkedin);

  let discovery: { brand: string; mentions: ScanMention[] } | null = null;
  let provider: "tavily" | "claude" = "tavily";

  if (hasTavily() && process.env.GROQ_API_KEY) {
    try {
      const host = new URL(normalized).hostname.replace(/^www\./, "");
      const broadQuery = `"${host}" OR "${brand}" review OR complaint OR "feature request" OR alternative`;
      const socialQuery = `"${host}" OR "${brand}"`;
      const handleQuery =
        twitterHandles.length > 0
          ? twitterHandles.map((h) => `"@${h}"`).join(" OR ")
          : null;

      const searches: Promise<{ results: Array<{ title: string; url: string; content: string }> }>[] = [
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
      const responses = await Promise.all(searches);
      const allResults = responses.flatMap((r) => r.results);
      const seenUrls = new Set<string>();
      const combined = allResults.filter((r) => {
        if (seenUrls.has(r.url)) return false;
        seenUrls.add(r.url);
        return true;
      });

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
        .slice(0, 20);

      discovery = await classifyWithGroq(brand, normalized, twitterHandles, linkedinRefs, body.extra, merged);
    } catch (err) {
      console.warn("[scans] Tavily+Groq discovery failed:", err);
    }
  }

  const needsFallback = !discovery || discovery.mentions.length === 0;
  if (needsFallback && process.env.ANTHROPIC_API_KEY) {
    const day = today();
    if (fallbackDay !== day) {
      fallbackDay = day;
      fallbackCount = 0;
    }
    if (fallbackCount < CLAUDE_FALLBACK_DAILY_CAP) {
      try {
        const claudeResult = await classifyWithClaude(brand, normalized);
        if (claudeResult) {
          discovery = claudeResult;
          provider = "claude";
          fallbackCount += 1;
        }
      } catch (err) {
        console.warn("[scans] Claude discovery fallback failed:", err);
      }
    }
  }

  if (!discovery) {
    return NextResponse.json(
      { error: "The search didn't return any content — please try again." },
      { status: 502 }
    );
  }

  const mentions = cleanMentions(discovery.mentions);
  const counts = countByCategory(mentions);
  const summary = await summarizeWithClaude(brand, mentions);

  const result: ScanResult = {
    brand: discovery.brand || brand,
    totalMentions: mentions.length,
    counts,
    summary,
    mentions,
  };

  const saved = await prisma.urlScan.upsert({
    where: { normalizedUrl: normalized },
    create: {
      normalizedUrl: normalized,
      brand: result.brand,
      resultJson: result as unknown as object,
      provider,
    },
    update: {
      brand: result.brand,
      resultJson: result as unknown as object,
      provider,
      refreshedAt: new Date(),
    },
  });

  return NextResponse.json({
    id: saved.id,
    ...buildTeaser(result),
    cached: false,
    provider,
  });
}
