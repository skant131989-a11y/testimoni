"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectCurrency, formatPrice, PRICING, type Currency } from "@/lib/constants";

interface PricingContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  proMonthly: number;
  proMonthlyFormatted: string;
  /** The struck-through regular price when a launch offer applies (INR), else null. */
  proMonthlyList: string | null;
  proMonthlyUsd: string;
  proMonthlyInr: string;
  proAiMonthly: number;
  proAiMonthlyFormatted: string;
  proAiMonthlyUsd: string;
  proAiMonthlyInr: string;
}

const PricingContext = createContext<PricingContextValue | null>(null);

/**
 * Rupee pricing for visitors in India, behind a switch.
 *
 * Pro is $19/mo everywhere unless NEXT_PUBLIC_INR_PRICING=1 is set. With it
 * on, a browser in an Indian time zone sees Pro at ₹499/mo and pays through a
 * rupee Razorpay plan (RAZORPAY_PRO_PLAN_ID_INR), because many Indian cards
 * decline recurring dollar charges. Everyone else, and the first paint
 * before the time zone is read, stays on USD, so there is no server/browser
 * mismatch. The switch is off until the rupee plan exists in Razorpay.
 */
export const INR_PRICING_ENABLED = process.env.NEXT_PUBLIC_INR_PRICING === "1";

function build(currency: Currency, setCurrency: (c: Currency) => void): PricingContextValue {
  return {
    currency,
    setCurrency,
    proMonthly: PRICING[currency].proMonthly,
    proMonthlyFormatted: formatPrice(PRICING[currency].proMonthly, currency),
    proMonthlyList:
      PRICING[currency].proListMonthly != null
        ? formatPrice(PRICING[currency].proListMonthly as number, currency)
        : null,
    proMonthlyUsd: formatPrice(PRICING.USD.proMonthly, "USD"),
    proMonthlyInr: formatPrice(PRICING.INR.proMonthly, "INR"),
    proAiMonthly: PRICING[currency].proAiMonthly,
    proAiMonthlyFormatted: formatPrice(PRICING[currency].proAiMonthly, currency),
    proAiMonthlyUsd: formatPrice(PRICING.USD.proAiMonthly, "USD"),
    proAiMonthlyInr: formatPrice(PRICING.INR.proAiMonthly, "INR"),
  };
}

export function PricingProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    if (INR_PRICING_ENABLED && detectCurrency() === "INR") setCurrency("INR");
  }, []);

  return <PricingContext.Provider value={build(currency, setCurrency)}>{children}</PricingContext.Provider>;
}

export function usePricing(): PricingContextValue {
  const ctx = useContext(PricingContext);
  return ctx ?? build("USD", () => {});
}

// Expose detectCurrency for callers that want to opt into geo-based defaults.
export { detectCurrency };
