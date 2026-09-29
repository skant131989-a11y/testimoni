import type { LeadSource, SocialProofStatus } from "@prisma/client";

/**
 * Shared types for the Testimoni Growth Engine (/admin/leads).
 * Business logic lives in this directory, separate from the admin
 * UI and API routes, so it can be reused by an MCP server later
 * without touching either (spec: "keep business logic separate so
 * MCP can be added later").
 */

// ── Raw provider output ──────────────────────────────────────────
// What a provider hands back BEFORE classification — just candidate
// text + where it came from. Providers never decide "is this praise"
// or "is this a lead" themselves; that's classify.ts's job, kept
// separate so every provider is judged by the same rules.
export interface RawCandidate {
  source: LeadSource;
  sourceUrl: string;
  /** Raw text to classify — a comment body, a post title+body, etc. */
  text: string;
  /** Author/handle if the provider exposes one, verbatim. */
  author?: string;
  /** ISO timestamp if the provider exposes one. */
  postedAt?: string;
  /** Product/company website if the provider already knows it
   *  (e.g. Product Hunt gives this directly) — saves a classify step. */
  knownWebsite?: string;
  knownProductName?: string;
  /**
   * Founder identity, when the PROVIDER itself (not the classifier's
   * free-text guess) can vouch for it — a Show HN post's author, or a
   * Product Hunt post's `makers`. Real data from the platform beats
   * an LLM inferring a name from a comment, so run-scan.ts prefers
   * these over the classifier's founderName/founderSocial when both
   * are present. Only set on the launch/post-level candidate, never
   * on an arbitrary comment (a commenter usually isn't the founder).
   */
  knownFounderName?: string;
  knownFounderSocial?: string;
}

export interface ProviderResult {
  source: LeadSource;
  candidates: RawCandidate[];
  /** Set when the provider failed or was skipped (not configured) —
   *  the scan run records this but keeps going. */
  error?: string;
}

// ── Classification output ────────────────────────────────────────
// One classified signal: either genuine customer praise about a
// specific product, or a founder asking about testimonials/social
// proof (spec section 2, second half). Both are valid lead signals,
// tagged so scoring/UI can treat them differently.
export type SignalType = "customer_praise" | "founder_seeking_proof";

export interface ClassifiedSignal {
  signalType: SignalType;
  isGenuine: boolean; // model's own confidence gate — false = discard
  companyName: string | null;
  productName: string | null;
  website: string | null; // raw string as found, normalized later
  founderName: string | null;
  founderSocial: string | null;
  /** Only ever set when an actual address is visible in the text —
   *  never invented, never guessed from a domain. */
  email: string | null;
  /** Verbatim excerpt, already trimmed to a short quotable length. */
  excerpt: string;
  author: string | null;
  category: string | null;
}

// ── Website inspection ───────────────────────────────────────────
export interface SocialProofInspection {
  status: SocialProofStatus;
  /** Short, human-readable reason grounded in what was actually seen
   *  ("no testimonial/reviews page found", "found a 'Wall of Love'
   *  link in nav"), never invented. */
  reason: string;
}

// ── Scoring ───────────────────────────────────────────────────────
export interface ScoreResult {
  score: number; // 0-100
  reasons: string[]; // each one a real, traceable signal
}

// ── Aggregated per-company candidate, pre-persistence ────────────
// Multiple raw candidates (possibly from different providers) that
// normalize to the same website get merged into one of these before
// scoring + DB upsert.
export interface LeadCandidate {
  website: string; // normalized hostname
  companyName: string | null;
  productName: string | null;
  founderName: string | null;
  founderSocial: string | null;
  publicBusinessEmail: string | null;
  category: string | null;
  source: LeadSource; // first/primary source
  sourceUrl: string;
  signals: {
    source: LeadSource;
    url: string;
    excerpt: string;
    author: string | null;
  }[];
}
