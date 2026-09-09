import type { NormalizedReview, ReviewSourceAdapter } from "./types";
import gplay from "google-play-scraper";

/**
 * Google Play Store adapter — scrapes the public reviews page.
 *
 * ─── Why the scraper, not the official API ────────────────────
 * Google's official androidpublisher.reviews.list is designed for
 * publishers reading THEIR OWN app's reviews (service account
 * bound to a specific Play Console). Testimoni's model is "user
 * pastes any Play Store URL, we pull the reviews" — that's a
 * different problem the official API can't solve without every
 * end-user setting up a service account and adding it to their
 * own Play Console. Impractical for a self-service SaaS.
 *
 * google-play-scraper hits Google Play's public review endpoints
 * (same content that shows in the browser), no auth needed. Same
 * pragma as the App Store adapter's public RSS approach.
 *
 * ─── Risks & mitigations ─────────────────────────────────────
 * - Not officially blessed: Google can change internal endpoints.
 *   The scraper package usually ships a fix within a week or two
 *   when this happens. Failures already surface via syncStatus:
 *   ERROR + syncError in the sources dashboard.
 * - Rate limits: Google throttles aggressive scraping. Our once-
 *   per-hour cap on Free plan syncs keeps us well under.
 * - ToS: reviews are public content Google publishes. Small-scale
 *   review syncing hasn't drawn attention historically. Not legal
 *   advice; revisit at 10k+ workspace scale.
 */

interface RawReview {
  id: string;
  userName: string;
  score: number;
  text: string | null;
  date: Date | string | null;
  url?: string;
}

/**
 * Parse a Play Store URL to extract the package name (appId).
 * Accepts:
 *   https://play.google.com/store/apps/details?id=com.example
 *   https://play.google.com/store/apps/details?id=com.example&hl=en
 */
function parsePlayStoreUrl(
  url: string,
): { externalAppId: string; displayName: string } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("play.google.com")) return null;
    const id = u.searchParams.get("id");
    if (!id) return null;
    return {
      externalAppId: id,
      // Package name is the best display we have until we look up
      // the actual app title in fetchReviews. The user can override
      // via the source's displayName in the DB anyway.
      displayName: id,
    };
  } catch {
    return null;
  }
}

async function fetchPlayStoreReviews(
  appId: string,
): Promise<NormalizedReview[]> {
  // Pull the 100 most recent English reviews. Same cap as the
  // Chrome Web Store adapter — enough to seed a wall without
  // overwhelming pending queue moderation.
  const result = await gplay.reviews({
    appId,
    lang: "en",
    country: "us",
    // NEWEST = 2 per google-play-scraper's constants. Hard-coding
    // avoids a TypeScript quirk where gplay.sort types as an enum
    // declaration but the runtime object doesn't expose it cleanly.
    sort: 2,
    num: 100,
  });

  const rawReviews: RawReview[] = Array.isArray(result)
    ? (result as RawReview[])
    : (result as { data: RawReview[] }).data ?? [];

  return rawReviews
    // Filter out rating-only reviews (empty text) — they'd be
    // useless testimonials. The adapter contract requires content.
    .filter((r) => typeof r.text === "string" && r.text.trim().length > 0)
    .map((r) => ({
      // Prefix with "gp:" so the same review id can't collide with
      // an App Store id (both use opaque strings).
      externalId: `gp:${r.id}`,
      authorName: r.userName || "Anonymous",
      authorHandle: null,
      rating: r.score,
      content: r.text!.trim(),
      sourceUrl:
        r.url ??
        `https://play.google.com/store/apps/details?id=${appId}&reviewId=${r.id}`,
      postedAt: r.date ? new Date(r.date) : new Date(),
    }));
}

export const googlePlayAdapter: ReviewSourceAdapter = {
  platform: "GOOGLE_PLAY",
  parseUrl: parsePlayStoreUrl,
  fetchReviews: fetchPlayStoreReviews,
  // No env var required — the scraper hits public endpoints.
  available: () => true,
};
