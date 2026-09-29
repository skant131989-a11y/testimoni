import type { SocialProofStatus } from "@prisma/client";
import type { ScoreResult } from "@/lib/leads/types";

/**
 * Deterministic 0-100 scoring — spec section 5. Kept rule-based (not
 * LLM-scored) so every point is traceable to a real, stored field:
 * the spec's hard requirement is "never fabricate praise or counts,"
 * and an LLM asked to score in one shot is the easiest way to
 * accidentally violate that by inventing a justification. The
 * `reasons` list this returns is literally the score_reason text —
 * every sentence in it maps to one of the inputs below, all of which
 * come from real signals stored on the Lead.
 */

export interface ScoreInput {
  praiseSignalCount: number;
  distinctPraiseSources: number;
  hasFounderName: boolean;
  hasContactMethod: boolean; // founderSocial or publicBusinessEmail
  hasFounderSeekingProofSignal: boolean; // spec 2's "how do I collect testimonials" type signal
  socialProofStatus: SocialProofStatus;
  isRecentActivity: boolean; // any signal within the last ~30 days
  alreadyContacted: boolean;
}

export function scoreLead(input: ScoreInput): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.praiseSignalCount > 0) {
    score += 20;
    reasons.push(
      `${input.praiseSignalCount} public customer praise signal${input.praiseSignalCount === 1 ? "" : "s"} found.`
    );
  }
  if (input.distinctPraiseSources >= 2) {
    score += 15;
    reasons.push(`Praise found across ${input.distinctPraiseSources} different sources.`);
  }
  if (input.hasFounderSeekingProofSignal) {
    score += 20;
    reasons.push("Founder was directly asking about testimonials/social proof.");
  }
  if (input.hasFounderName) {
    score += 10;
    reasons.push("Founder identified by name.");
  }
  if (input.hasContactMethod) {
    score += 10;
    reasons.push("A legitimate contact method (social handle or public email) is available.");
  }
  if (input.isRecentActivity) {
    score += 10;
    reasons.push("Activity is recent (within the last ~30 days).");
  }

  // The core Testimoni-specific signal: praise exists but isn't
  // being used on the company's own site. Spec: "should strongly
  // increase lead score."
  switch (input.socialProofStatus) {
    case "NO_SOCIAL_PROOF":
      if (input.praiseSignalCount > 0) {
        score += 20;
        reasons.push(
          "Website has no visible testimonial/social-proof section — that praise is going unused."
        );
      }
      break;
    case "WEAK_SOCIAL_PROOF":
      score += 12;
      reasons.push("Website's social proof looks thin (a passing mention, no dedicated section).");
      break;
    case "STRONG_SOCIAL_PROOF":
      score -= 15;
      reasons.push("Website already has strong, dedicated social proof — lower priority.");
      break;
    case "HAS_TESTIMONIALS":
    case "UNKNOWN":
      // Neither raises nor lowers — HAS_TESTIMONIALS means "some
      // proof exists, unclear if underused"; UNKNOWN means we
      // couldn't inspect the site at all, so no assumption either way.
      break;
  }

  if (input.praiseSignalCount === 0 && !input.hasFounderSeekingProofSignal) {
    // No evidence of customers at all — spec explicitly lowers score
    // here. Cap rather than let other bonuses (recency, contact
    // method) carry a company with zero customer signal too high.
    score = Math.min(score, 30);
    reasons.push("No evidence of existing customers found yet.");
  }

  if (input.alreadyContacted) {
    score -= 30;
    reasons.push("Already contacted.");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, reasons };
}
