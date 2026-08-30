import { NextResponse } from "next/server";

/**
 * Public read-only tweet/LinkedIn preview endpoint. Used by the
 * homepage "Paste a tweet" demo — anonymous visitors paste a URL,
 * we fetch the author + text, they see the transformation into a
 * testimonial card, no signup required.
 *
 * Does NOT touch the DB. Rate-limited per-IP to prevent abuse of
 * the underlying oEmbed/scrape calls.
 */

interface PreviewResult {
  content: string;
  customerName: string;
  customerUrl?: string | null;
  source: "TWITTER" | "LINKEDIN";
  sourceUrl: string;
}

function parseUrl(input: string): { platform: "twitter" | "linkedin" | "unknown"; url: string } {
  const url = input.trim();
  if (/(?:twitter|x)\.com\/[^/]+\/status\/\d+/i.test(url)) {
    return { platform: "twitter", url };
  }
  if (/linkedin\.com\/(feed\/update|posts|pulse)/i.test(url)) {
    return { platform: "linkedin", url };
  }
  return { platform: "unknown", url };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchTwitter(url: string): Promise<PreviewResult | null> {
  const oembed = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=1&hide_thread=1`;
  try {
    const res = await fetch(oembed, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      author_name?: string;
      author_url?: string;
      html?: string;
    };
    const html = data.html || "";
    const paragraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const content = paragraphMatch ? stripHtml(paragraphMatch[1]) : stripHtml(html);
    if (!content) return null;
    return {
      content,
      customerName: data.author_name || "Twitter user",
      customerUrl: data.author_url ?? null,
      source: "TWITTER",
      sourceUrl: url,
    };
  } catch {
    return null;
  }
}

async function fetchLinkedIn(url: string): Promise<PreviewResult | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Testimoni/1.0; +https://testimoni.io)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const pick = (prop: string) => {
      const re = new RegExp(
        `<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`,
        "i"
      );
      const m = html.match(re);
      return m ? m[1] : null;
    };
    const content = pick("og:description");
    const title = pick("og:title");
    if (!content) return null;
    const customerName = title ? title.split(" on LinkedIn")[0].split(" | ")[0].trim() : "LinkedIn user";
    return {
      content: content.trim(),
      customerName,
      source: "LINKEDIN",
      sourceUrl: url,
    };
  } catch {
    return null;
  }
}

// Simple in-memory per-IP rate limit — 10 previews per minute per IP.
// Good enough for a public demo; real production abuse should hit
// Vercel edge rate limits before this trips.
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many previews — try again in a minute." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const input = typeof body?.url === "string" ? body.url : "";
  if (!input) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  const { platform, url } = parseUrl(input);
  if (platform === "unknown") {
    return NextResponse.json(
      {
        error:
          "Only X/Twitter and LinkedIn URLs work. Paste a tweet or LinkedIn post URL.",
      },
      { status: 400 }
    );
  }

  const result =
    platform === "twitter" ? await fetchTwitter(url) : await fetchLinkedIn(url);

  if (!result) {
    return NextResponse.json(
      {
        error:
          "Couldn't read that URL. Post may be private, deleted, or the URL is malformed. Try a public post URL.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ testimonial: result });
}
