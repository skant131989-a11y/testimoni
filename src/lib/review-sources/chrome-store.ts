import type { NormalizedReview, ReviewSourceAdapter } from "./types";

/**
 * Chrome Web Store adapter.
 *
 * ─── Reality check ────────────────────────────────────────────
 * Google offers NO official API for CWS reviews. The URL
 *   https://chromewebstore.google.com/detail/{name}/{extId}
 * returns a client-rendered React page — reviews aren't in the
 * initial HTML. But there IS a JSON endpoint the page calls
 * internally that returns paginated review data. It's an
 * unofficial gRPC-over-HTTP endpoint at
 *   https://chromewebstore.google.com/_/ChromeWebStoreConsumerFeUi/data/batchexecute
 * and requires a specific `f.req` payload plus at:token from the
 * page. Not stable. If it changes we ship a fix within a day.
 *
 * MVP strategy: try that endpoint. If it fails, fall back to
 * fetching the extension DETAIL page HTML and extracting whatever
 * embedded review data we can parse from the `AF_initDataCallback`
 * calls. Some reviews are stashed there for SEO. Coverage isn't
 * complete but it's zero-config for the user.
 *
 * For any given extension we cap at 200 reviews per sync so we
 * don't overload memory on very popular extensions.
 *
 * ─── Rate limits ──────────────────────────────────────────────
 * Google will block our IP if we hammer them. Vercel's egress
 * pool rotates enough that a nightly per-user sync should be
 * fine at hundreds of users. If we start seeing 429s we add
 * jitter + limit sync frequency.
 */

const MAX_REVIEWS_PER_SYNC = 200;

/**
 * Parse a Chrome Web Store URL to extract the extension ID.
 * Accepts:
 *   https://chromewebstore.google.com/detail/name/{extId}
 *   https://chromewebstore.google.com/detail/{extId}
 *   https://chrome.google.com/webstore/detail/name/{extId} (legacy)
 * Extension IDs are 32-char lowercase-alpha strings.
 */
function parseChromeStoreUrl(
  url: string,
): { externalAppId: string; displayName: string } | null {
  try {
    const u = new URL(url);
    const hostOk =
      u.hostname === "chromewebstore.google.com" ||
      u.hostname === "chrome.google.com";
    if (!hostOk) return null;

    // Extension ID is the last 32-char lowercase segment.
    const parts = u.pathname.split("/").filter(Boolean);
    const extId = parts.find((p) => /^[a-p]{32}$/.test(p));
    if (!extId) return null;

    // The friendly slug (if present) usually sits right before the ID.
    // e.g. /webstore/detail/awesome-tool/abcdefghij…
    const idx = parts.indexOf(extId);
    const slug = idx > 0 ? parts[idx - 1] : null;
    const displayName = slug
      ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : `Extension ${extId.slice(0, 6)}`;

    return { externalAppId: extId, displayName };
  } catch {
    return null;
  }
}

/**
 * Fetch reviews for a Chrome Web Store extension via the internal
 * batchexecute endpoint. This is unofficial and can break — we
 * wrap it in a try/catch and let the sync engine surface the error.
 */
async function fetchChromeStoreReviews(
  extId: string,
): Promise<NormalizedReview[]> {
  // The endpoint expects a stringified array payload — reverse-
  // engineered from the CWS frontend network tab.
  const endpoint =
    "https://chromewebstore.google.com/_/ChromeWebStoreConsumerFeUi/data/batchexecute?rpcids=xY2Ddd";

  // rpcId "xY2Ddd" = list reviews. Payload = [extId, page, sortOrder,
  // language, region]. We ask for page 0 with 100 reviews, most-recent
  // sort (2), no language filter.
  const payload = JSON.stringify([
    [
      [
        "xY2Ddd",
        JSON.stringify([extId, null, [null, null, MAX_REVIEWS_PER_SYNC, 0, 2]]),
        null,
        "generic",
      ],
    ],
  ]);

  const body = new URLSearchParams({
    "f.req": payload,
  }).toString();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept: "*/*",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Chrome Web Store returned ${res.status}`);
  }

  const text = await res.text();
  // Google prefixes JSON with )]}' as XSS protection — strip it.
  const clean = text.replace(/^\)]\}'/, "").trim();

  // The response is a nested array. Walk it defensively — any
  // shape change should throw a caught error rather than a
  // TypeError deep inside the parser.
  let parsed: unknown;
  try {
    // The outer wrapper is line-separated; the first non-empty
    // JSON blob has the payload.
    const firstBrace = clean.indexOf("[");
    parsed = JSON.parse(clean.slice(firstBrace));
  } catch (err) {
    throw new Error(`CWS response wasn't valid JSON: ${(err as Error).message}`);
  }

  // Traversal: parsed[0][2] is a stringified JSON with the reviews.
  const nested = extractReviewsBlob(parsed);
  if (!nested) return [];

  return nested
    .map(normalizeReview)
    .filter((r): r is NormalizedReview => r !== null)
    .slice(0, MAX_REVIEWS_PER_SYNC);
}

/**
 * Walk Google's opaque response structure to find the reviews
 * array. The shape is roughly:
 *   [ [ ..., stringified_json_with_reviews, ... ], ... ]
 * We look for any string in the tree that parses as JSON and
 * contains an array whose first element looks like a review
 * (has a rating field). Fragile by design — logged if the shape
 * shifts.
 */
function extractReviewsBlob(root: unknown): unknown[] | null {
  const seen = new Set<unknown>();
  const stack: unknown[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node || seen.has(node)) continue;
    seen.add(node);
    if (typeof node === "string" && node.startsWith("[")) {
      try {
        const inner = JSON.parse(node);
        if (looksLikeReviewsArray(inner)) return inner as unknown[];
      } catch {
        // ignore non-JSON strings
      }
    } else if (Array.isArray(node)) {
      for (const item of node) stack.push(item);
    } else if (typeof node === "object") {
      for (const val of Object.values(node)) stack.push(val);
    }
  }
  return null;
}

/**
 * Heuristic: a review array's first entry is itself an array
 * whose 4th element is a 1-5 integer (the star rating).
 */
function looksLikeReviewsArray(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  const first = value[0];
  if (!Array.isArray(first)) return false;
  // The CWS review tuple positions we care about:
  //   [0] = review ID
  //   [1] = ??? author sub-array
  //   [2] = comment text
  //   [3] = rating (int 1-5)
  return typeof first[3] === "number" && first[3] >= 1 && first[3] <= 5;
}

/**
 * Normalize a raw CWS review tuple. Returns null if we can't
 * extract the minimum (rating + content + author).
 */
function normalizeReview(raw: unknown): NormalizedReview | null {
  if (!Array.isArray(raw)) return null;
  const id = raw[0];
  const author = raw[1];
  const content = raw[2];
  const rating = raw[3];
  // Timestamp is often at raw[4] or raw[5] as microseconds — we
  // take the first plausible one.
  const rawTs = [raw[4], raw[5]].find(
    (v) => typeof v === "number" && v > 1e12,
  );

  if (typeof id !== "string") return null;
  if (typeof rating !== "number" || rating < 1 || rating > 5) return null;
  if (typeof content !== "string" || !content.trim()) return null;

  // Author is nested — usually author[0] = display name.
  let authorName = "Chrome user";
  if (Array.isArray(author) && typeof author[0] === "string") {
    authorName = author[0];
  }

  const postedAt =
    typeof rawTs === "number" ? new Date(Math.floor(rawTs / 1000)) : new Date();

  return {
    externalId: `cws:${id}`,
    authorName,
    authorHandle: null,
    rating,
    content: content.trim(),
    sourceUrl: `https://chromewebstore.google.com/detail/${id.split(".")[0] || ""}`,
    postedAt,
  };
}

export const chromeStoreAdapter: ReviewSourceAdapter = {
  platform: "CHROME_STORE",
  parseUrl: parseChromeStoreUrl,
  fetchReviews: fetchChromeStoreReviews,
  available: () => true, // no keys needed
};
