/**
 * Shared shape + teaser/quick/deep gating for the "Find + Understand"
 * URL scan tool. Used by the scan-creation route (POST /api/scans),
 * the scan-read route (GET /api/scans/[id]), and the verify route so
 * every response path computes the free/paid view identically — the
 * gating has to happen here, server-side, never in the client.
 */

export type ScanCategory =
  | "praise"
  | "complaint"
  | "feature_request"
  | "use_case"
  | "testimonial"
  | "outcome"
  | "competitor_mention";

export const CATEGORY_ORDER: ScanCategory[] = [
  "praise",
  "complaint",
  "feature_request",
  "use_case",
  "testimonial",
  "outcome",
  "competitor_mention",
];

// A mention can belong to more than one category (e.g. praise +
// outcome) — spec explicitly calls this out, so categories is an
// array, not a single enum value.
export interface ScanMention {
  content: string;
  author: string;
  role?: string;
  source: string;
  sourceUrl?: string;
  categories: ScanCategory[];
  score: number;
  /** Only ever set when discovered explicitly in the source snippet — never invented. */
  date?: string;
  /** Only meaningful when categories includes "competitor_mention". */
  competitorName?: string;
}

export interface ScanSummary {
  loves: string;
  dislikes: string;
  requests: string;
  howDescribed: string;
  /** Deep-tier only field — see summarizeWithClaude. */
  whyChosen: string;
}

export interface CompetitorCount {
  name: string;
  count: number;
}

export interface ScanResult {
  brand: string;
  totalMentions: number;
  counts: Record<ScanCategory, number>;
  summary: ScanSummary;
  mentions: ScanMention[];
}

export function emptyCounts(): Record<ScanCategory, number> {
  return {
    praise: 0,
    complaint: 0,
    feature_request: 0,
    use_case: 0,
    testimonial: 0,
    outcome: 0,
    competitor_mention: 0,
  };
}

// A mention increments the count for every category it belongs to.
export function countByCategory(
  mentions: ScanMention[]
): Record<ScanCategory, number> {
  const counts = emptyCounts();
  for (const m of mentions) {
    for (const category of m.categories) counts[category] += 1;
  }
  return counts;
}

export function hasCategory(m: ScanMention, category: ScanCategory): boolean {
  return m.categories.includes(category);
}

export function strongestSocialProof(mentions: ScanMention[]): ScanMention[] {
  return mentions
    .filter((m) => hasCategory(m, "praise") || hasCategory(m, "testimonial"))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function competitorsMentioned(mentions: ScanMention[]): CompetitorCount[] {
  const counts = new Map<string, number>();
  for (const m of mentions) {
    if (!hasCategory(m, "competitor_mention") || !m.competitorName) continue;
    const name = m.competitorName.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export interface ScanTeaser {
  brand: string;
  totalMentions: number;
  counts: Record<ScanCategory, number>;
  summary: Pick<ScanSummary, "loves" | "dislikes" | "requests" | "howDescribed">;
  mentions: ScanMention[];
  locked: true;
  tier: null;
  exportable: false;
}

export interface ScanQuick {
  brand: string;
  totalMentions: number;
  counts: Record<ScanCategory, number>;
  summary: Pick<ScanSummary, "loves" | "dislikes" | "requests" | "howDescribed">;
  mentions: ScanMention[];
  locked: false;
  tier: "quick";
  exportable: false;
}

export interface ScanDeep extends ScanResult {
  locked: false;
  tier: "deep";
  exportable: true;
  strongestSocialProof: ScanMention[];
  competitorsMentioned: CompetitorCount[];
}

/**
 * Free view: full counts + the 4 basic summary fields + exactly one
 * full mention per category present (the highest-scored one, without
 * reusing the same quote across categories when a lower-scored
 * alternative exists — a mention tagged both praise+outcome
 * shouldn't visibly double as "the" free sample for both).
 */
export function buildTeaser(result: ScanResult): ScanTeaser {
  const used = new Set<ScanMention>();
  const sample: ScanMention[] = [];
  for (const category of CATEGORY_ORDER) {
    const inCategory = result.mentions
      .filter((m) => hasCategory(m, category))
      .sort((a, b) => b.score - a.score);
    // If every mention in this category is already showing as another
    // category's sample, skip it rather than re-pushing a duplicate —
    // the category's count still renders correctly above, and the
    // "+N more" locked line covers it without repeating a quote.
    const pick = inCategory.find((m) => !used.has(m));
    if (pick) {
      sample.push(pick);
      used.add(pick);
    }
  }
  const { loves, dislikes, requests, howDescribed } = result.summary;
  return {
    brand: result.brand,
    totalMentions: result.totalMentions,
    counts: result.counts,
    summary: { loves, dislikes, requests, howDescribed },
    mentions: sample,
    locked: true,
    tier: null,
    exportable: false,
  };
}

// All evidence, basic summary only — no export, no extended insights.
export function buildQuick(result: ScanResult): ScanQuick {
  const { loves, dislikes, requests, howDescribed } = result.summary;
  return {
    brand: result.brand,
    totalMentions: result.totalMentions,
    counts: result.counts,
    summary: { loves, dislikes, requests, howDescribed },
    mentions: result.mentions,
    locked: false,
    tier: "quick",
    exportable: false,
  };
}

// Everything, plus the 3 extended insight sections + export.
export function buildFull(result: ScanResult): ScanDeep {
  return {
    ...result,
    locked: false,
    tier: "deep",
    exportable: true,
    strongestSocialProof: strongestSocialProof(result.mentions),
    competitorsMentioned: competitorsMentioned(result.mentions),
  };
}
