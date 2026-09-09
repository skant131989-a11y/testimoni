import type { NormalizedReview, ReviewSourceAdapter } from "./types";

/**
 * Shopify App Store adapter.
 *
 * ─── How this works ─────────────────────────────────────────────
 * Shopify App Store review pages live at
 *   https://apps.shopify.com/<slug>/reviews
 * They're server-rendered HTML — no auth, no API key. We fetch the
 * page, extract review blocks, and normalize.
 *
 * Two extraction strategies, tried in order:
 *   1. JSON-LD structured data. Shopify includes `Review` items in a
 *      `<script type="application/ld+json">` block for SEO. When
 *      present this is the most stable path — Google demands the
 *      schema so Shopify keeps it accurate.
 *   2. HTML fallback. If JSON-LD is missing or empty, we regex-match
 *      the review-item divs on the page. Less stable but keeps us
 *      functioning if Shopify strips structured data.
 *
 * Pagination: we fetch the first 5 pages (~50-100 reviews). Enough
 * to seed a wall without overwhelming pending queue moderation.
 *
 * ─── Risks & mitigations ────────────────────────────────────────
 * - Shopify's HTML can change. Sync failures surface as syncStatus:
 *   ERROR + syncError in the dashboard. Users can flag it, we ship
 *   a regex fix in an afternoon.
 * - Rate limits: no known anti-bot on the /reviews route today.
 *   Vercel's egress pool rotates enough for a nightly sync at
 *   hundreds of users. Add jitter if we hit 429s later.
 * - ToS: review content is public and Shopify indexes it in Google.
 *   Small-scale review syncing hasn't drawn attention historically.
 */

const MAX_PAGES = 5;
const MAX_REVIEWS_PER_SYNC = 100;

interface ShopifyJsonLdReview {
  "@type"?: string;
  author?: string | { "@type"?: string; name?: string };
  reviewRating?: { ratingValue?: string | number };
  reviewBody?: string;
  datePublished?: string;
}

interface ShopifyJsonLdRoot {
  "@type"?: string;
  review?: ShopifyJsonLdReview[];
}

/**
 * Parse an apps.shopify.com URL to extract the app slug.
 * Accepts:
 *   https://apps.shopify.com/{slug}
 *   https://apps.shopify.com/{slug}/reviews
 *   https://apps.shopify.com/{slug}/reviews?page=2
 */
function parseShopifyUrl(
  url: string,
): { externalAppId: string; displayName: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "apps.shopify.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    // First path segment is the slug. Anything after (reviews,
    // etc.) is a sub-route — the slug is the app identity.
    const slug = parts[0];
    if (!slug || slug.length < 2) return null;
    return {
      externalAppId: slug,
      // Slug is usually kebab-case — humanize for display until we
      // scrape the actual product name.
      displayName: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  } catch {
    return null;
  }
}

async function fetchPage(slug: string, page: number): Promise<string> {
  const url = `https://apps.shopify.com/${slug}/reviews?page=${page}&sort_by=most_recent`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`Shopify App Store returned ${res.status} for ${slug}`);
  }
  return res.text();
}

/**
 * Strategy 1: pull reviews from JSON-LD. Shopify includes SEO
 * structured data on review pages; when present it's the cleanest
 * source (rating, author, body, date all typed).
 */
function extractFromJsonLd(html: string): NormalizedReview[] {
  const reviews: NormalizedReview[] = [];
  const scriptRe =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(html))) {
    let data: unknown;
    try {
      data = JSON.parse(match[1].trim());
    } catch {
      continue;
    }
    // The block can be a single object, an array of objects, or an
    // @graph wrapper. Normalize into a list.
    const items: ShopifyJsonLdRoot[] = Array.isArray(data)
      ? (data as ShopifyJsonLdRoot[])
      : [data as ShopifyJsonLdRoot];
    for (const item of items) {
      const raw = item?.review;
      if (!Array.isArray(raw)) continue;
      for (const r of raw) {
        if (!r || typeof r !== "object") continue;
        const content = (r.reviewBody ?? "").trim();
        if (!content) continue;
        const ratingRaw = r.reviewRating?.ratingValue;
        const rating = typeof ratingRaw === "string" ? parseFloat(ratingRaw) : Number(ratingRaw ?? 0);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue;
        const authorName =
          typeof r.author === "string"
            ? r.author
            : r.author?.name ?? "Anonymous";
        const posted = r.datePublished ? new Date(r.datePublished) : new Date();
        reviews.push({
          externalId: `sh:${authorName}:${(r.datePublished ?? "").slice(0, 10)}:${content.slice(0, 24)}`,
          authorName,
          authorHandle: null,
          rating: Math.round(rating),
          content,
          sourceUrl: "",
          postedAt: posted,
        });
      }
    }
  }
  return reviews;
}

/**
 * Strategy 2: HTML regex fallback. If JSON-LD is missing, look
 * for the review-item pattern in the raw HTML. Multiple selectors
 * to survive minor markup changes.
 */
function extractFromHtml(html: string): NormalizedReview[] {
  const reviews: NormalizedReview[] = [];

  // Block heuristic — try a couple of container attributes Shopify
  // has used over the years. We split the HTML by whichever matches,
  // then extract fields from each block.
  const blockPatterns = [
    /<div[^>]*data-merchant-review[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
    /<div[^>]*class=["'][^"']*review-listing[^"']*["'][^>]*>([\s\S]*?)(?=<div[^>]*class=["'][^"']*review-listing|$)/gi,
    /<article[^>]*review[^>]*>([\s\S]*?)<\/article>/gi,
  ];

  let blocks: string[] = [];
  for (const p of blockPatterns) {
    const matches = html.match(p);
    if (matches && matches.length > 0) {
      blocks = matches;
      break;
    }
  }

  for (const block of blocks) {
    // Rating — aria-label pattern used across Shopify's review UI.
    const ratingMatch =
      block.match(/aria-label=["'](\d)\s*(?:of|out of)\s*5\s*stars/i) ||
      block.match(/data-rating=["'](\d)["']/i);
    if (!ratingMatch) continue;
    const rating = parseInt(ratingMatch[1], 10);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue;

    // Content — first <p> after the rating, or the review-content class.
    const contentMatch =
      block.match(/<p[^>]*class=["'][^"']*review-listing__body[^"']*["'][^>]*>([\s\S]*?)<\/p>/i) ||
      block.match(/<div[^>]*class=["'][^"']*review-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
      block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const content = contentMatch
      ? stripHtml(contentMatch[1]).trim()
      : "";
    if (!content) continue;

    // Author — h3/h4 or specific class.
    const authorMatch =
      block.match(/<h\d[^>]*class=["'][^"']*review-listing__author[^"']*["'][^>]*>([\s\S]*?)<\/h\d>/i) ||
      block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);
    const authorName = authorMatch ? stripHtml(authorMatch[1]).trim() : "Anonymous";

    // Date — <time datetime="…"> or class review-listing__meta.
    const dateMatch =
      block.match(/<time[^>]*datetime=["']([^"']+)["']/i) ||
      block.match(/data-review-published=["']([^"']+)["']/i);
    const posted = dateMatch ? new Date(dateMatch[1]) : new Date();

    reviews.push({
      externalId: `sh:${authorName}:${posted.toISOString().slice(0, 10)}:${content.slice(0, 24)}`,
      authorName,
      authorHandle: null,
      rating,
      content,
      sourceUrl: "",
      postedAt: posted,
    });
  }
  return reviews;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchShopifyReviews(slug: string): Promise<NormalizedReview[]> {
  const collected = new Map<string, NormalizedReview>();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    let html: string;
    try {
      html = await fetchPage(slug, page);
    } catch (err) {
      // If page 1 fails outright, bubble; if a later page fails,
      // return what we have.
      if (page === 1) throw err;
      break;
    }

    let batch = extractFromJsonLd(html);
    if (batch.length === 0) batch = extractFromHtml(html);

    let addedThisPage = 0;
    for (const r of batch) {
      if (collected.has(r.externalId)) continue;
      collected.set(r.externalId, {
        ...r,
        sourceUrl: `https://apps.shopify.com/${slug}/reviews?page=${page}`,
      });
      addedThisPage += 1;
      if (collected.size >= MAX_REVIEWS_PER_SYNC) break;
    }

    if (collected.size >= MAX_REVIEWS_PER_SYNC) break;
    // No new reviews on this page → we've reached the tail.
    if (addedThisPage === 0) break;
  }
  return [...collected.values()];
}

export const shopifyAdapter: ReviewSourceAdapter = {
  platform: "SHOPIFY",
  parseUrl: parseShopifyUrl,
  fetchReviews: fetchShopifyReviews,
  // No env vars required — public HTML.
  available: () => true,
};
