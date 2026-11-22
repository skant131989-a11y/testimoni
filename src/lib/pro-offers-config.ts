/**
 * Pro price options beyond the regular $19 a month. Pure data, safe to import
 * from the browser; the server-side checks live in pro-offers.ts.
 *
 *   monthly          $19 a month   (the regular plan)
 *   annual           $149 a year   (regular, about 35% off)
 *   founding         $9 a month    (first 25 customers, locked while subscribed)
 *   founding_annual  $99 a year    (first 25 customers, locked while subscribed)
 *
 * Each option is its own Razorpay plan; the webhook turns any of them into
 * Pro, so entitlements never differ.
 */
export type ProVariant = "monthly" | "annual" | "founding" | "founding_annual";

export const FOUNDING_SEATS = 25;

/**
 * The $9 / $99 prices are a time-limited offer: first 25 customers, and
 * only until this moment (exclusive). After it, the offer is gone even if
 * spots remain, on the server as well as in the page copy.
 */
export const OFFER_ENDS_AT = "2027-01-01T00:00:00Z";
export const OFFER_END_LABEL = "31 December";

export const PRO_OFFER_PRICES = {
  monthly: 19,
  annual: 149,
  founding: 9,
  founding_annual: 99,
} as const;

export function isProVariant(x: unknown): x is ProVariant {
  return x === "monthly" || x === "annual" || x === "founding" || x === "founding_annual";
}

/** What /api/billing/offers returns. */
export interface ProOffers {
  /** Founding spots: shown only while some are left. */
  founding: { available: boolean; left: number; monthly: boolean; annual: boolean };
  /** The regular yearly plan. */
  annual: boolean;
}
