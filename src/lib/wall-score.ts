import type { Testimonial } from "@prisma/client";

/**
 * Wall Score — a 0-100 composite of testimonial health.
 *
 * The dimensions map to what actually makes social proof convert:
 *   Volume   (25pts) — enough to look real, not sparse
 *   Diversity(15pts) — multiple sources, not all-from-one-form
 *   Recency  (15pts) — fresh, not stale from 2 years ago
 *   Video    (15pts) — highest-trust format on the page
 *   Verified (15pts) — link-back to source (tweet URL, review URL)
 *   Ratings  (15pts) — avg star rating on rated testimonials
 *
 * Deliberately rule-based (no LLM) so the score is stable and
 * cheap — a user re-running the audit expects the same number.
 * Recommendations are rule-derived from the weakest dimensions.
 */

export type WallScoreBreakdown = {
  volume: number;
  diversity: number;
  recency: number;
  video: number;
  verified: number;
  ratings: number;
};

export type WallScoreRecommendation = {
  issue: string;
  suggestion: string;
  dimension: keyof WallScoreBreakdown;
};

export type WallScoreResult = {
  score: number;
  breakdown: WallScoreBreakdown;
  recommendations: WallScoreRecommendation[];
  totalTestimonials: number;
  approvedCount: number;
  videoCount: number;
};

const NOW_MS = () => Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

export function computeWallScore(
  testimonials: readonly Testimonial[]
): WallScoreResult {
  const approved = testimonials.filter((t) => t.status === "APPROVED");
  const total = approved.length;

  // Volume — 0 → 0, 5 → 10, 20 → 20, 50+ → 25
  let volume = 0;
  if (total >= 50) volume = 25;
  else if (total >= 20) volume = 20 + Math.round(((total - 20) / 30) * 5);
  else if (total >= 5) volume = 10 + Math.round(((total - 5) / 15) * 10);
  else if (total > 0) volume = Math.round((total / 5) * 10);

  // Diversity — count unique sources (MANUAL, TWITTER, LINKEDIN, etc.)
  const uniqueSources = new Set(approved.map((t) => t.source)).size;
  const diversity = Math.min(15, uniqueSources * 3);

  // Recency — % approved in last 30 days
  const now = NOW_MS();
  const fresh = approved.filter(
    (t) => now - new Date(t.createdAt).getTime() < 30 * DAY_MS
  ).length;
  const freshPct = total > 0 ? fresh / total : 0;
  const recency = Math.round(freshPct * 15);

  // Video — 15pts if >=1 video, scale down
  const videoCount = approved.filter(
    (t) => t.videoUrl || t.videoStorageKey
  ).length;
  const video = videoCount === 0 ? 0 : videoCount >= 3 ? 15 : 5 + videoCount * 3;

  // Verified — % of testimonials with a source_url (link-back proves
  // they're real)
  const verifiedCount = approved.filter((t) => t.sourceUrl).length;
  const verifiedPct = total > 0 ? verifiedCount / total : 0;
  const verified = Math.round(verifiedPct * 15);

  // Ratings — avg star rating of rated testimonials → 15pts at 5.0
  const rated = approved.filter((t) => t.rating != null && t.rating > 0);
  const avgRating =
    rated.length > 0
      ? rated.reduce((s, t) => s + (t.rating || 0), 0) / rated.length
      : 0;
  const ratings = Math.round((avgRating / 5) * 15);

  const breakdown: WallScoreBreakdown = {
    volume,
    diversity,
    recency,
    video,
    verified,
    ratings,
  };

  const score = Math.min(
    100,
    Math.max(0, volume + diversity + recency + video + verified + ratings)
  );

  return {
    score,
    breakdown,
    recommendations: buildRecommendations(breakdown, {
      total,
      videoCount,
      verifiedCount,
      fresh,
      uniqueSources,
    }),
    totalTestimonials: testimonials.length,
    approvedCount: total,
    videoCount,
  };
}

type RecoContext = {
  total: number;
  videoCount: number;
  verifiedCount: number;
  fresh: number;
  uniqueSources: number;
};

function buildRecommendations(
  b: WallScoreBreakdown,
  c: RecoContext
): WallScoreRecommendation[] {
  const recs: WallScoreRecommendation[] = [];

  if (b.volume < 15) {
    recs.push({
      dimension: "volume",
      issue: `Only ${c.total} approved testimonials — visitors expect at least 10-20 for social proof to feel real.`,
      suggestion:
        "Send your collection form to 20 recent customers. DM the ones you have the closest relationship with first — reply rate on those is ~40%.",
    });
  }

  if (b.diversity < 9) {
    recs.push({
      dimension: "diversity",
      issue: `All feedback comes from ${c.uniqueSources} source type${c.uniqueSources === 1 ? "" : "s"} — visitors trust a mix more than 30 identical form submissions.`,
      suggestion:
        "Import 5 praise tweets and 5 LinkedIn replies. Both take 30 seconds with URL import in /dashboard/import.",
    });
  }

  if (b.video < 10) {
    recs.push({
      dimension: "video",
      issue:
        c.videoCount === 0
          ? "No video testimonials — video converts 34% higher than text on Testimoni user data."
          : `Only ${c.videoCount} video — one more takes you from single-anecdote to trend.`,
      suggestion:
        "Reply to your best 3 text testimonials with 'Would you be up for a 30-second Loom saying this?' Templates in /dashboard → Share.",
    });
  }

  if (b.verified < 9) {
    recs.push({
      dimension: "verified",
      issue: `Only ${c.verifiedCount} of ${c.total} testimonials link back to a source URL — visitors can't verify they're real.`,
      suggestion:
        "For URL-imported testimonials (tweets, LinkedIn, reviews) the source URL is auto-captured. Add source URLs to manual entries where you can.",
    });
  }

  if (b.recency < 8 && c.total > 5) {
    recs.push({
      dimension: "recency",
      issue: `Only ${c.fresh} testimonials from the last 30 days — old walls read as neglected products.`,
      suggestion:
        "Set up auto-sync from App Store / Play Store / Chrome Web Store in /dashboard/sources — new reviews land on the wall automatically.",
    });
  }

  if (b.ratings < 10 && c.total > 3) {
    recs.push({
      dimension: "ratings",
      issue:
        "Star rating average is below 4/5 — either the product needs work or the collection form is capturing low-intent responses.",
      suggestion:
        "Filter your form's testimonials by rating and only auto-approve ≥4-star. Reach out personally to lower-rated ones.",
    });
  }

  return recs.slice(0, 4);
}
