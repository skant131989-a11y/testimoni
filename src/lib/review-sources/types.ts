/**
 * Common shape for a review pulled from any external platform.
 * Every adapter (App Store, Play Store, Product Hunt, Chrome
 * Store) normalizes its API/HTML response into this so the sync
 * engine and Testimonial-writer don't need per-platform knowledge.
 */
export interface NormalizedReview {
  /** Platform-stable ID for the review — used to dedup on re-sync.
   *  Prefix with platform code so the same ID can't collide across
   *  sources (e.g. "gp:AOqpTOH..." vs "as:12345678"). */
  externalId: string;

  /** Reviewer's display name, verbatim from the platform. */
  authorName: string;
  /** Optional handle / URL / userid on the source platform. */
  authorHandle?: string | null;

  /** Star rating 1-5. Every supported platform normalizes to this. */
  rating: number;

  /** The review body. Never null — an empty rating-only review
   *  should be filtered out at the adapter before reaching here. */
  content: string;

  /** Original review URL if the platform exposes one (deep link
   *  back to the review or the app page). */
  sourceUrl: string;

  /** When the review was posted, best available from the platform. */
  postedAt: Date;
}

/**
 * Contract every platform adapter must implement.
 *   parseUrl:  turn a user-pasted URL into the platform's stable
 *              app identifier + a friendly display name. Returns
 *              null if the URL isn't recognizable.
 *   fetchReviews: call the platform API/scraper and return
 *              normalized reviews. Throws on network / auth
 *              failure; returns empty array on "no reviews yet".
 *   available: whether the platform is currently enabled — i.e.
 *              has the required env keys or infra to actually run.
 *              Client UI reads this to disable options that would
 *              otherwise silently fail with a config error.
 */
export interface ReviewSourceAdapter {
  platform:
    | "APP_STORE"
    | "GOOGLE_PLAY"
    | "PRODUCT_HUNT"
    | "CHROME_STORE"
    | "SHOPIFY"
    | "TRUSTPILOT";

  parseUrl(url: string): { externalAppId: string; displayName: string } | null;

  fetchReviews(externalAppId: string): Promise<NormalizedReview[]>;

  available(): boolean;
}
