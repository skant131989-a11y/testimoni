import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { groqChat, hasGroq, GROQ_CHAT_MODEL } from "@/lib/groq";
import { getAnthropic } from "@/lib/anthropic";

/**
 * POST /api/tools/find-proof/import
 *
 * Anonymous "Add praise our search missed" endpoint. Accepts one
 * of three kinds:
 *
 *   { kind: "url",  url: "https://twitter.com/…" }
 *     → fetches the page HTML, feeds to Groq Qwen to extract
 *       author + quote. Free.
 *
 *   { kind: "text", author: "…", content: "…" }
 *     → deterministic, no LLM call. Free.
 *
 *   { kind: "image", image: "data:image/png;base64,…" }
 *     → Claude Sonnet vision extracts author + quote. Paid.
 *       Rate-capped per IP + globally so we don't burn Anthropic
 *       budget on anonymous testing.
 *
 * Returns a single quote object that the client appends to the
 * results list — same shape as find-proof's topQuotes items so
 * the UI treats it identically.
 */

const BODY = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("url"),
    url: z.string().min(4).max(500),
  }),
  z.object({
    kind: z.literal("text"),
    author: z.string().min(1).max(200),
    content: z.string().min(5).max(2000),
    source: z.string().max(40).optional(),
  }),
  z.object({
    kind: z.literal("image"),
    image: z
      .string()
      .startsWith("data:image/")
      .max(10 * 1024 * 1024),
  }),
]);

const QuoteOut = z.object({
  content: z.string(),
  author: z.string(),
  role: z.string().optional(),
  source: z.string(),
  sourceUrl: z.string().optional(),
  score: z.number().int().min(1).max(100),
});
type Quote = z.infer<typeof QuoteOut>;

// Per-IP rate limits — protect against loops.
// Anonymous screenshot users get exactly 1 free extraction — they
// experience the magic, then get nudged to sign up (signed-in Free
// tier gets 3 more per month via the main screenshot-to-testimonial
// route).
const URL_LIMIT_PER_DAY = 10;
const IMAGE_LIMIT_PER_DAY = 1;
const IMAGE_GLOBAL_CAP = 20;
const ipHits = new Map<
  string,
  { day: string; url: number; image: number }
>();
let globalDay = "";
let globalImage = 0;

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

function inferSourceFromUrl(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("twitter.com") || u.includes("x.com")) return "X";
  if (u.includes("linkedin.com")) return "LinkedIn";
  if (u.includes("reddit.com")) return "Reddit";
  if (u.includes("producthunt.com")) return "Product Hunt";
  if (u.includes("news.ycombinator.com")) return "Hacker News";
  if (u.includes("trustpilot.com")) return "Trustpilot";
  if (u.includes("g2.com")) return "G2";
  return "Blog";
}

async function fetchAndParseUrl(url: string): Promise<Quote> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  let html = "";
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
          "(KHTML, like Gecko) Version/17.0 Safari/605.1.15 Testimoni-Bot/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Fetch returned ${res.status}`);
    html = await res.text();
  } catch (err) {
    clearTimeout(timer);
    throw new Error(
      `We couldn't reach that URL — it may be private, login-gated, or blocking bots. Try the "Type it" tab instead.`
    );
  }

  // Trim HTML aggressively before sending to LLM: strip <script>,
  // <style>, <svg>, comments, then collapse whitespace and cap at
  // 8K chars. Groq's free tier has a tight TPM ceiling.
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);

  if (!hasGroq()) {
    throw new Error("Import unavailable — Groq API key not configured.");
  }

  const { text } = await groqChat({
    model: GROQ_CHAT_MODEL,
    max_tokens: 400,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You extract a single positive customer quote from a webpage. Return ONLY JSON: {"content":"the verbatim positive quote or the whole tweet/post text","author":"the person's name or @handle","role":"their title if visible, else empty"}.

Rules:
- content: use the actual quote/tweet text verbatim, no rewriting.
- author: person or @handle if visible in the page; otherwise "Anonymous".
- role: only if the page states it (e.g. "CEO of Acme"). Otherwise "".
- Never invent facts. If no positive quote is present, return {"content":"","author":"","role":""}.
- No prose, no markdown fences.`,
      },
      {
        role: "user",
        content: `URL: ${url}\n\nPAGE CONTENT:\n${cleaned}`,
      },
    ],
  });

  // Extract JSON with brace-depth walker.
  const start = text.indexOf("{");
  if (start === -1) throw new Error("Model returned no JSON.");
  let depth = 0,
    end = -1,
    inStr = false,
    esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
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
  if (end === -1) throw new Error("Model output was malformed.");
  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    content?: string;
    author?: string;
    role?: string;
  };

  if (!parsed.content || parsed.content.length < 5) {
    throw new Error(
      "We couldn't find a clear quote on that page. Try the \"Type it\" tab instead."
    );
  }

  return {
    content: parsed.content.slice(0, 600),
    author: parsed.author?.slice(0, 100) || "Anonymous",
    role: parsed.role ? parsed.role.slice(0, 100) : undefined,
    source: inferSourceFromUrl(url),
    sourceUrl: url,
    score: 80,
  };
}

async function parseImage(imageDataUrl: string): Promise<Quote> {
  const anthropic = getAnthropic();
  const match = imageDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  const [, mediaTypeRaw, base64] = match;
  const validTypes = ["image/webp", "image/jpeg", "image/png", "image/gif"] as const;
  type ValidType = (typeof validTypes)[number];
  const mediaType = (validTypes.includes(mediaTypeRaw as ValidType)
    ? mediaTypeRaw
    : "image/png") as ValidType;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 400,
    system: `You extract one positive customer quote from a screenshot (DM, tweet, Slack message, review, etc.). Return ONLY JSON: {"content":"exact quote text","author":"person's name or @handle","source":"X|LinkedIn|Slack|Discord|Email|WhatsApp|Instagram|Review|Other"}. Never invent facts. If no quote is present, return {"content":"","author":"","source":"Other"}.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extract the customer quote and author from this screenshot.",
          },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Model returned no text.");
  const start = block.text.indexOf("{");
  const end = block.text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Malformed output.");
  const parsed = JSON.parse(block.text.slice(start, end + 1)) as {
    content?: string;
    author?: string;
    source?: string;
  };
  if (!parsed.content || parsed.content.length < 5) {
    throw new Error(
      "We couldn't read a quote from that screenshot. Try cropping to just the quote text."
    );
  }
  return {
    content: parsed.content.slice(0, 600),
    author: parsed.author?.slice(0, 100) || "Anonymous",
    source: parsed.source || "Other",
    score: 85,
  };
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const ip = ipFrom(req);
  const day = today();
  const hit = ipHits.get(ip) ?? { day, url: 0, image: 0 };
  if (hit.day !== day) {
    hit.day = day;
    hit.url = 0;
    hit.image = 0;
  }

  try {
    let quote: Quote;

    if (body.kind === "url") {
      if (hit.url >= URL_LIMIT_PER_DAY) {
        return NextResponse.json(
          {
            error: `You've added ${URL_LIMIT_PER_DAY} links today. Sign up to keep going — it's free.`,
          },
          { status: 429 }
        );
      }
      quote = await fetchAndParseUrl(body.url);
      hit.url += 1;
    } else if (body.kind === "text") {
      quote = {
        content: body.content.trim().slice(0, 600),
        author: body.author.trim().slice(0, 100),
        source: body.source || "Direct",
        score: 70,
      };
    } else {
      // image
      if (globalDay !== day) {
        globalDay = day;
        globalImage = 0;
      }
      if (globalImage >= IMAGE_GLOBAL_CAP) {
        return NextResponse.json(
          {
            error:
              "We've hit today's screenshot limit — try again tomorrow, or paste the text directly.",
          },
          { status: 429 }
        );
      }
      if (hit.image >= IMAGE_LIMIT_PER_DAY) {
        return NextResponse.json(
          {
            error:
              "You've used your free screenshot. Sign up to add more — it's free.",
          },
          { status: 429 }
        );
      }
      quote = await parseImage(body.image);
      hit.image += 1;
      globalImage += 1;
    }

    ipHits.set(ip, hit);
    return NextResponse.json({ quote });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Import failed";
    console.warn("[find-proof/import]", body.kind, "failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
