export const PLAN_LIMITS = {
  FREE: {
    maxTestimonials: 10,
    maxWidgets: 1,
    maxForms: 1,
    // How many videos a Free workspace can host at once. Set to 1 so
    // Free users experience the full "upload -> plays on wall ->
    // embed" flow (that's what converts), but can't burn our
    // Supabase Free-tier storage quota with dozens of large clips.
    // Delete their video to upload a new one, or upgrade to Pro for
    // unlimited.
    maxVideos: 1,
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
    // Ask My Wall chatbot — Pro AI tier only feature; false here.
    askMyWall: false,
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
    // Pro gets 1 audit (same as Free — no additional Wall Score.
    // Real tracking value lives in Pro AI).
    maxWallScoreAudits: 1,
    // Pro is where the "AI-flavored" perk lives so $9 doesn't
    // feel AI-empty. Unlimited Testimonial → Tweet drafts.
    maxTweetDraftsPerMonth: Infinity,
    askMyWall: false,
    wallScoreTracking: false,
  },
  PRO_AI: {
    // Inherits every Pro utility limit at Infinity.
    maxTestimonials: Infinity,
    maxWidgets: Infinity,
    maxForms: Infinity,
    maxVideos: Infinity,
    layouts: ["GRID", "MASONRY", "CAROUSEL", "LIST", "MARQUEE"] as const,
    video: true,
    watermark: false,
    customBranding: true,
    // Wall Score: unlimited on-demand + weekly emailed report +
    // trend graph. The intelligence layer users pay $29 for.
    maxWallScoreAudits: Infinity,
    maxTweetDraftsPerMonth: Infinity,
    askMyWall: true,
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
    proMonthly: 9,
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
