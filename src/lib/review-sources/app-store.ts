import type { NormalizedReview, ReviewSourceAdapter } from "./types";

/**
 * Apple App Store adapter.
 *
 * ─── Auth ─────────────────────────────────────────────────────
 * Apple has TWO ways to fetch reviews:
 *
 *   1. App Store Connect API — requires JWT signed with your
 *      developer key. Full history, all countries, filterable.
 *      Best for production but needs config work.
 *
 *   2. Public RSS feed at
 *      https://itunes.apple.com/{country}/rss/customerreviews/id={appId}/json
 *      Zero auth. Public. Works for ANY app, not just your own.
 *      Rate-limited to ~50 reviews per feed, only recent ones.
 *
 * MVP uses the RSS feed — works instantly for every user with a
 * public app URL, no App Store Connect config required. Ship the
 * ASC API path in Phase 2 for users who want historical backfill
 * or all-country coverage.
 *
 * ─── Country selection ────────────────────────────────────────
 * The RSS feed is per-country. We iterate the top-5 English-
 * speaking markets (us, gb, ca, au, in) and merge results,
 * deduping by review ID. Users can override the country list
 * once the ASC API path ships.
 */

const COUNTRIES = ["us", "gb", "ca", "au", "in"];
const MAX_PER_COUNTRY = 50;

/**
 * Parse an App Store URL. Accepts several shapes:
 *   https://apps.apple.com/us/app/name/id123456789
 *   https://apps.apple.com/app/id123456789
 *   https://itunes.apple.com/us/app/name/id123456789
 * Extract the numeric ID from the last segment starting with "id".
 */
function parseAppStoreUrl(
  url: string,
): { externalAppId: string; displayName: string } | null {
  try {
    const u = new URL(url);
    if (
      !/apple\.com$/i.test(u.hostname) &&
      !/itunes\.apple\.com$/i.test(u.hostname)
    ) {
      return null;
    }
    const parts = u.pathname.split("/").filter(Boolean);
    const idPart = parts.find((p) => /^id\d+$/i.test(p));
    if (!idPart) return null;
    const externalAppId = idPart.slice(2);
    // The app name typically sits right before "id...".
    const idx = parts.indexOf(idPart);
    const slug = idx > 0 ? parts[idx - 1] : null;
    const displayName = slug
      ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : `App ${externalAppId}`;
    return { externalAppId, displayName };
  } catch {
    return null;
  }
}

interface AppleRssResponse {
  feed?: {
    entry?: unknown;
  };
}

interface RawAppleReview {
  id: { label: string };
  author: { name: { label: string }; uri?: { label: string } };
  "im:rating": { label: string };
  content: { label: string };
  title: { label: string };
  updated: { label: string };
}

async function fetchAppStoreReviews(
  appId: string,
): Promise<NormalizedReview[]> {
  const merged = new Map<string, NormalizedReview>();
  for (const country of COUNTRIES) {
    try {
      const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=mostRecent/page=1/json`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; TestimoniBot/1.0; +https://testimoni.io)",
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as AppleRssResponse;

      // The first entry in the feed is the app info; reviews start at [1].
      // If there's only one entry, it's the app metadata → no reviews.
      const raw = data.feed?.entry;
      const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const reviews = entries.slice(1) as RawAppleReview[];

      for (const r of reviews.slice(0, MAX_PER_COUNTRY)) {
        if (!r?.id?.label) continue;
        const rating = parseInt(r["im:rating"]?.label ?? "0", 10);
        if (!rating || rating < 1 || rating > 5) continue;
        const content = r.content?.label?.trim();
        if (!content) continue;

        merged.set(`as:${r.id.label}`, {
          externalId: `as:${r.id.label}`,
          authorName: r.author?.name?.label || "App Store user",
          authorHandle: r.author?.uri?.label ?? null,
          rating,
          content,
          sourceUrl: `https://apps.apple.com/app/id${appId}`,
          postedAt: r.updated?.label ? new Date(r.updated.label) : new Date(),
        });
      }
    } catch {
      // Per-country failures are non-fatal — we still return
      // whatever succeeded.
      continue;
    }
  }

  return [...merged.values()].sort(
    (a, b) => b.postedAt.getTime() - a.postedAt.getTime(),
  );
}

export const appStoreAdapter: ReviewSourceAdapter = {
  platform: "APP_STORE",
  parseUrl: parseAppStoreUrl,
  fetchReviews: fetchAppStoreReviews,
  available: () => true, // RSS is public
};
