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
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export type Currency = "USD" | "INR";

export const PRICING: Record<
  Currency,
  { symbol: string; code: Currency; proMonthly: number; locale: string }
> = {
  USD: { symbol: "$", code: "USD", proMonthly: 9, locale: "en-US" },
  INR: { symbol: "₹", code: "INR", proMonthly: 859, locale: "en-IN" },
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
