"use client";

import { createContext, useContext, type ReactNode } from "react";
import { detectCurrency, formatPrice, PRICING, type Currency } from "@/lib/constants";

interface PricingContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  proMonthly: number;
  proMonthlyFormatted: string;
  proMonthlyUsd: string;
  proMonthlyInr: string;
  proAiMonthly: number;
  proAiMonthlyFormatted: string;
  proAiMonthlyUsd: string;
  proAiMonthlyInr: string;
}

const PricingContext = createContext<PricingContextValue | null>(null);

export function PricingProvider({ children }: { children: ReactNode }) {
  // Pro is a flat $19/mo everywhere — no more region-based INR pricing,
  // so there's nothing to detect or switch. Kept as a fixed value (not
  // a literal constant inline) so every consumer still reads through
  // this one context.
  const currency: Currency = "USD";
  const setCurrency = () => {};

  const proMonthly = PRICING[currency].proMonthly;
  const proMonthlyFormatted = formatPrice(proMonthly, currency);
  const proMonthlyUsd = formatPrice(PRICING.USD.proMonthly, "USD");
  const proMonthlyInr = formatPrice(PRICING.INR.proMonthly, "INR");
  const proAiMonthly = PRICING[currency].proAiMonthly;
  const proAiMonthlyFormatted = formatPrice(proAiMonthly, currency);
  const proAiMonthlyUsd = formatPrice(PRICING.USD.proAiMonthly, "USD");
  const proAiMonthlyInr = formatPrice(PRICING.INR.proAiMonthly, "INR");

  return (
    <PricingContext.Provider
      value={{
        currency,
        setCurrency,
        proMonthly,
        proMonthlyFormatted,
        proMonthlyUsd,
        proMonthlyInr,
        proAiMonthly,
        proAiMonthlyFormatted,
        proAiMonthlyUsd,
        proAiMonthlyInr,
      }}
    >
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing(): PricingContextValue {
  const ctx = useContext(PricingContext);
  if (!ctx) {
    return {
      currency: "USD",
      setCurrency: () => {},
      proMonthly: PRICING.USD.proMonthly,
      proMonthlyFormatted: formatPrice(PRICING.USD.proMonthly, "USD"),
      proMonthlyUsd: formatPrice(PRICING.USD.proMonthly, "USD"),
      proMonthlyInr: formatPrice(PRICING.INR.proMonthly, "INR"),
      proAiMonthly: PRICING.USD.proAiMonthly,
      proAiMonthlyFormatted: formatPrice(PRICING.USD.proAiMonthly, "USD"),
      proAiMonthlyUsd: formatPrice(PRICING.USD.proAiMonthly, "USD"),
      proAiMonthlyInr: formatPrice(PRICING.INR.proAiMonthly, "INR"),
    };
  }
  return ctx;
}

// Expose detectCurrency for callers that want to opt into geo-based defaults.
export { detectCurrency };

