import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { getEffectiveLimits } from "@/lib/plan";
import { sanitizeImportedText } from "@/lib/sanitize-imported-text";
import { fetchTweetViaSyndication } from "@/lib/twitter-syndication";
import { invalidateWallCache } from "@/lib/wall-cache";

interface ImportResult {
  content: string;
  customerName: string;
  customerTitle?: string | null;
  customerAvatar?: string | null;
  customerUrl?: string | null;
  source:
    | "TWITTER"
    | "LINKEDIN"
    | "REDDIT"
    | "HACKER_NEWS"
    | "PRODUCT_HUNT"
    | "IMPORT";
  sourceUrl: string;
}

function parseUrl(input: string): {
  platform:
    | "twitter"
    | "linkedin"
    | "reddit"
    | "hackernews"
    | "producthunt"
    | "unknown";
  url: string;
} {
  const url = input.trim();
  if (/(?:twitter|x)\.com\/[^/]+\/status\/\d+/i.test(url)) {
    return { platform: "twitter", url };
  }
  if (/linkedin\.com\/(feed\/update|posts|pulse)/i.test(url)) {
    return { platform: "linkedin", url };
  }
  if (/reddit\.com\/r\/[^/]+\/(comments|s)\//i.test(url)) {
    return { platform: "reddit", url };
  }
  if (/news\.ycombinator\.com\/item\?id=\d+/i.test(url)) {
    return { platform: "hackernews", url };
  }
  if (/producthunt\.com\/(posts|products|p)\//i.test(url)) {
    return { platform: "producthunt", url };
  }
  return { platform: "unknown", url };
}

// Reasonable fallback name when the user manually pastes a
// testimonial for a platform where we couldn't auto-fetch the
// author. Keeps the source badge honest without inventing a name.
function defaultManualAuthor(
  platform:
    | "twitter"
    | "linkedin"
    | "reddit"
    | "hackernews"
    | "producthunt"
    | "unknown"
): string {
  const map: Record<string, string> = {
    twitter: "X user",
    linkedin: "LinkedIn user",
    reddit: "Reddit user",
    hackernews: "HN user",
    producthunt: "Product Hunt user",
  };
  return map[platform] || "Anonymous";
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

async function fetchTwitter(url: string): Promise<ImportResult | null> {
  // Primary: Twitter's public syndication endpoint. Returns the tweet's
  // canonical text (no HTML wrapping, no oEmbed-appended "…" on
  // full-length tweets) plus author metadata. Falls back to oEmbed if
  // it 404s or rate-limits — mostly a safety net for URL patterns
  // syndication rejects.
  const syndicated = await fetchTweetViaSyndication(url);
  if (syndicated && syndicated.content) {
    return {
      // For X-Premium note_tweets (long tweets) the syndication API
      // returns only the visible portion — append "…" so readers know
      // there is more on X.
      content: syndicated.truncated
        ? `${syndicated.content}…`
        : syndicated.content,
      customerName: syndicated.authorName,
      customerAvatar: syndicated.authorAvatarUrl,
      customerUrl: syndicated.authorProfileUrl,
      source: "TWITTER",
      sourceUrl: url,
    };
  }

  // Fallback: Twitter's public oEmbed endpoint.
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
    // The <p>...</p> inside the blockquote contains the tweet body.
    const paragraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const rawContent = paragraphMatch ? stripHtml(paragraphMatch[1]) : stripHtml(html);
    const content = sanitizeImportedText(rawContent);
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

async function fetchLinkedIn(url: string): Promise<ImportResult | null> {
  // No oEmbed — read OG tags. LinkedIn often serves the post excerpt in
  // og:description and the author in og:title.
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
      content: sanitizeImportedText(content),
      customerName,
      source: "LINKEDIN",
      sourceUrl: url,
    };
  } catch {
    return null;
  }
}

// Reddit — the public .json endpoint that used to be one-fetch-magic
// was locked down for datacenter IPs in mid-2023. We still try it
// first because it works from Vercel edge in some regions; if it
// returns HTML instead of JSON (Reddit's "Blocked" page), we fall
// back to reading OG meta tags off the plain HTML view. Either
// path gives us the comment/post body + author.
async function fetchReddit(url: string): Promise<ImportResult | null> {
  const jsonUrl = url.replace(/\/?$/, "") + ".json";
  try {
    const res = await fetch(jsonUrl, {
      headers: {
        // Reddit's rate-limit tier is friendlier when we identify
        // clearly (their bot-detection is UA-based).
        "User-Agent": "web:testimoni:1.0 (by /u/testimoni-app)",
        Accept: "application/json",
      },
    });
    const ct = res.headers.get("content-type") || "";
    if (res.ok && ct.includes("application/json")) {
      const data = (await res.json()) as Array<{
        data?: { children?: Array<{ data?: RedditPost }> };
      }>;
      // The .json response is [postListing, commentsListing]. Element
      // 0's first child is the post itself.
      const post = data?.[0]?.data?.children?.[0]?.data;
      if (post && post.selftext && post.author) {
        return {
          content: sanitizeImportedText(post.selftext),
          customerName: `u/${post.author}`,
          customerUrl: `https://www.reddit.com/user/${post.author}`,
          source: "REDDIT",
          sourceUrl: url,
        };
      }
      // For URL/link posts with no self-text, prefer the title.
      if (post && post.title && post.author) {
        return {
          content: sanitizeImportedText(post.title),
          customerName: `u/${post.author}`,
          customerUrl: `https://www.reddit.com/user/${post.author}`,
          source: "REDDIT",
          sourceUrl: url,
        };
      }
    }
    // Fallback: read OG tags from the public HTML view.
    return await fetchOgTags(url, "REDDIT", { authorFromMeta: true });
  } catch {
    return await fetchOgTags(url, "REDDIT", { authorFromMeta: true });
  }
}

interface RedditPost {
  author?: string;
  title?: string;
  selftext?: string;
}

// Hacker News — public Firebase JSON API, no auth, no bot detection.
// Extract the item id from the URL, hydrate through /v0/item/{id}.json.
async function fetchHackerNews(url: string): Promise<ImportResult | null> {
  const idMatch = url.match(/[?&]id=(\d+)/);
  if (!idMatch) return null;
  const id = idMatch[1];
  try {
    const res = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`
    );
    if (!res.ok) return null;
    const item = (await res.json()) as {
      by?: string;
      text?: string;
      title?: string;
      type?: string;
      deleted?: boolean;
      dead?: boolean;
    };
    if (!item || item.deleted || item.dead || !item.by) return null;

    // Comments have `text` (HTML), stories have `title` (plain text).
    // Titles alone aren't great testimonials, but if that's all we
    // have we still surface it so the user can decide.
    const rawContent = item.text
      ? stripHtml(item.text)
      : item.title
        ? item.title
        : "";
    if (!rawContent) return null;

    return {
      content: sanitizeImportedText(rawContent),
      customerName: item.by,
      customerUrl: `https://news.ycombinator.com/user?id=${item.by}`,
      source: "HACKER_NEWS",
      sourceUrl: url,
    };
  } catch {
    return null;
  }
}

// Product Hunt — the GraphQL API needs an OAuth token we don't have,
// so we scrape OG tags off the public product/launch page. Comments
// often live behind lazy-loaded JSON, so the best public signal is
// the product's og:description + og:title.
async function fetchProductHunt(url: string): Promise<ImportResult | null> {
  return await fetchOgTags(url, "PRODUCT_HUNT", { authorFromMeta: false });
}

// Shared OG-tag reader used by Reddit fallback + Product Hunt. Reads
// og:description as the body and og:title as the display label.
// A best-effort last resort — good enough to import ONE row so the
// user can edit it after; not a substitute for a real API.
async function fetchOgTags(
  url: string,
  source: "REDDIT" | "PRODUCT_HUNT",
  opts: { authorFromMeta: boolean }
): Promise<ImportResult | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TestimoniBot/1.0; +https://testimoni.io)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const pick = (prop: string) => {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
        "i"
      );
      const m = html.match(re);
      return m ? m[1] : null;
    };
    const description = pick("og:description");
    const title = pick("og:title");
    if (!description && !title) return null;
    let content = sanitizeImportedText(description || title || "");
    if (!content) return null;

    // Product Hunt articles and long-form Reddit posts can have
    // multi-thousand-character og:descriptions. A testimonial card
    // won't render 6000 chars gracefully — cap at 400 and append "…"
    // so the user can edit it down after import instead of pasting
    // a wall of text.
    const MAX = 400;
    if (content.length > MAX) {
      content = content.slice(0, MAX).replace(/\s+\S*$/, "") + "…";
    }

    // Reddit's og:title looks like: `u/username on r/subreddit: "…"`.
    // Extract the username so the card shows a real handle.
    let name = source === "REDDIT" ? "Reddit user" : "Product Hunt";
    let customerUrl: string | null = null;
    if (opts.authorFromMeta && title) {
      const uMatch = title.match(/u\/([A-Za-z0-9_-]+)/);
      if (uMatch) name = `u/${uMatch[1]}`;
    }

    // Product Hunt: extract the real author from the page. PH ships
    // both a <meta name="author"> tag and inline JSON with
    // {"name":"X","username":"y"} — the meta tag is the most reliable
    // signal, the JSON gives us the profile link. Falls back to
    // "Product Hunt" if neither is present.
    if (source === "PRODUCT_HUNT") {
      const authorMeta = html.match(
        /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i
      );
      if (authorMeta) name = authorMeta[1];
      const usernameMatch = html.match(
        /"name":"([^"]+)","username":"([^"]+)"/
      );
      if (usernameMatch) {
        // Prefer the JSON name if we don't have one yet, and always
        // build the profile URL from the username.
        if (name === "Product Hunt") name = usernameMatch[1];
        customerUrl = `https://www.producthunt.com/@${usernameMatch[2]}`;
      }
    }

    return {
      content,
      customerName: name,
      customerUrl,
      source,
      sourceUrl: url,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const input = typeof body?.url === "string" ? body.url : "";
  // Optional manual-paste fallback fields — sent when a prior
  // auto-fetch failed and the user pasted the text themselves in
  // the inline retry form. When present we skip the platform
  // fetcher entirely and trust these values.
  const manualText =
    typeof body?.manualText === "string" ? body.manualText.trim() : "";
  const manualAuthor =
    typeof body?.manualAuthor === "string" ? body.manualAuthor.trim() : "";
  if (!input) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  const { platform, url } = parseUrl(input);
  if (platform === "unknown") {
    return NextResponse.json(
      {
        error:
          "URL not recognised. Paste a public X/Twitter, LinkedIn, Reddit, Hacker News, or Product Hunt link.",
      },
      { status: 400 }
    );
  }

  // Plan gate — same testimonial cap as manual create.
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: auth.workspace.id },
  });
  const limits = getEffectiveLimits(auth.workspace.slug, subscription?.plan);
  const currentCount = await prisma.testimonial.count({
    where: { workspaceId: auth.workspace.id },
  });
  if (currentCount >= limits.maxTestimonials) {
    return NextResponse.json(
      { error: "Testimonial limit reached. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  let result: ImportResult | null;
  // Manual-paste fallback path — user's inline retry after an
  // auto-fetch failure. Skip the platform fetcher and build the
  // result from what they pasted. Works for any platform, but in
  // practice used for Reddit / Product Hunt where datacenter IPs
  // are blocked or comment-specific text isn't parseable.
  if (manualText) {
    const sourceMap: Record<string, ImportResult["source"]> = {
      twitter: "TWITTER",
      linkedin: "LINKEDIN",
      reddit: "REDDIT",
      hackernews: "HACKER_NEWS",
      producthunt: "PRODUCT_HUNT",
    };
    result = {
      content: sanitizeImportedText(manualText),
      customerName: manualAuthor || defaultManualAuthor(platform),
      source: sourceMap[platform] || "IMPORT",
      sourceUrl: url,
    };
  } else if (platform === "twitter") result = await fetchTwitter(url);
  else if (platform === "linkedin") result = await fetchLinkedIn(url);
  else if (platform === "reddit") result = await fetchReddit(url);
  else if (platform === "hackernews") result = await fetchHackerNews(url);
  else if (platform === "producthunt") result = await fetchProductHunt(url);
  else result = null;

  if (!result) {
    // Auto-fetch failed. Return a MANUAL_FALLBACK signal so the UI
    // can render an inline "paste text here" retry form instead of
    // a dead error state. Reddit and PH lead here most often; other
    // platforms only when the URL is genuinely broken.
    const messages: Record<string, string> = {
      reddit:
        "Reddit blocks us from reading this post directly. Paste the comment text below and we'll save it with the source link.",
      producthunt:
        "We couldn't parse this Product Hunt page. Paste the comment text below and we'll save it with the source link.",
      hackernews:
        "Couldn't read that HN item — it may be deleted, or you can paste the text below.",
      twitter:
        "Couldn't read that tweet — it may be private or deleted. You can paste the text below.",
      linkedin:
        "LinkedIn didn't return enough content. Paste the post text below and we'll save it.",
    };
    return NextResponse.json(
      {
        error:
          messages[platform] ||
          "Couldn't read that URL. Paste the text below and we'll save it.",
        manualFallback: true,
        platform,
      },
      { status: 422 }
    );
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      workspaceId: auth.workspace.id,
      content: result.content,
      customerName: result.customerName,
      customerTitle: result.customerTitle ?? null,
      customerAvatar: result.customerAvatar ?? null,
      customerUrl: result.customerUrl ?? null,
      rating: 5,
      source: result.source,
      sourceUrl: result.sourceUrl,
      status: "APPROVED",
    },
  });

  // Auto-add to the workspace's default (oldest) widget so the imported
  // testimonial appears on the hosted wall immediately — same behaviour
  // as /api/submissions/[id]/approve.
  const defaultWidget = await prisma.widget.findFirst({
    where: { workspaceId: auth.workspace.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (defaultWidget) {
    const nextPosition = await prisma.widgetTestimonial.count({
      where: { widgetId: defaultWidget.id },
    });
    await prisma.widgetTestimonial.upsert({
      where: {
        widgetId_testimonialId: {
          widgetId: defaultWidget.id,
          testimonialId: testimonial.id,
        },
      },
      create: {
        widgetId: defaultWidget.id,
        testimonialId: testimonial.id,
        position: nextPosition,
      },
      update: {},
    });
  }

  invalidateWallCache();

  return NextResponse.json({
    testimonial,
    widget: defaultWidget
      ? { id: defaultWidget.id, name: defaultWidget.name }
      : null,
  });
}
