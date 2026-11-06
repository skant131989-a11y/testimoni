export const PLAN_LIMITS = {
  FREE: {
    maxTestimonials: 15,
    maxWidgets: 1,
    maxForms: 1,
    // How many videos a Free workspace can host at once. Two lets Free
    // users experience the full "upload -> plays on wall -> embed"
    // flow (that's what converts) without burning our Supabase
    // storage quota on dozens of large clips. Delete one to upload a
    // new one, or upgrade to Pro for unlimited.
    maxVideos: 2,
    layouts: ["GRID"] as const,
    video: true,
    watermark: true,
    customBranding: false,
    // ─── AI features ────────────────────────────────────────────
    // Wall Score: 1 lifetime audit (viral hook — user gets the
    // score card image once and can screenshot/share). No renewal.
    maxWallScoreAudits: 1,
    // Testimonial → Tweet drafts per calendar month.
    maxTweetDraftsPerMonth: 5,
    // Ask My Wall chatbot: a capped taste on Free. Answers come from
    // Groq only (never Claude); if Groq is down the visitor gets the
    // closest real quotes instead. Pro is unlimited.
    askMyWall: true,
    askMyWallAnswersPerMonth: 30,
    // Wall Score tracking & weekly email — Pro AI only.
    wallScoreTracking: false,
  },
  PRO: {
    maxTestimonials: Infinity,
    maxWidgets: Infinity,
    maxForms: Infinity,
    maxVideos: Infinity,
    layouts: ["GRID", "MASONRY", "CAROUSEL", "LIST", "MARQUEE"] as const,
    video: true,
    watermark: false,
    customBranding: true,
    // Every AI feature is unlocked at the Pro tier — we consolidated
    // back to a single paid tier after the "Pro AI" split experiment
    // didn't earn its complexity pre-scale. Revisit when we see a
    // usage cohort that would justify carving it back out.
    maxWallScoreAudits: Infinity,
    maxTweetDraftsPerMonth: Infinity,
    askMyWall: true,
    askMyWallAnswersPerMonth: Infinity,
    wallScoreTracking: true,
  },
  // Retained in PLAN_LIMITS + Prisma PlanType because deleting an
  // enum member is a migration hassle and this tier may come back.
  // Kept identical to PRO so any lingering code path that checks
  // `plan === "PRO_AI"` still behaves correctly.
  PRO_AI: {
    maxTestimonials: Infinity,
    maxWidgets: Infinity,
    maxForms: Infinity,
    maxVideos: Infinity,
    layouts: ["GRID", "MASONRY", "CAROUSEL", "LIST", "MARQUEE"] as const,
    video: true,
    watermark: false,
    customBranding: true,
    maxWallScoreAudits: Infinity,
    maxTweetDraftsPerMonth: Infinity,
    askMyWall: true,
    askMyWallAnswersPerMonth: Infinity,
    wallScoreTracking: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export type Currency = "USD" | "INR";

export const PRICING: Record<
  Currency,
  {
    symbol: string;
    code: Currency;
    proMonthly: number;
    proAiMonthly: number;
    locale: string;
  }
> = {
  USD: {
    symbol: "$",
    code: "USD",
    proMonthly: 19,
    proAiMonthly: 29,
    locale: "en-US",
  },
  INR: {
    symbol: "₹",
    code: "INR",
    proMonthly: 499,
    proAiMonthly: 1499,
    locale: "en-IN",
  },
};

export function formatPrice(amount: number, currency: Currency): string {
  const { symbol, locale } = PRICING[currency];
  return `${symbol}${new Intl.NumberFormat(locale).format(amount)}`;
}

/**
 * Detect currency from user's timezone. Runs safely on both server and client.
 * India → INR. Everything else → USD. Extend as new regions are supported.
 */
export function detectCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "INR";
  } catch {
    // fall through
  }
  return "USD";
}

/**
 * @deprecated Use PRICING[currency].proMonthly instead — kept for back-compat.
 */
export const PRO_PRICE_MONTHLY = PRICING.USD.proMonthly;
