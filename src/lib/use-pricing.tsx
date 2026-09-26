"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectCurrency, formatPrice, PRICING, type Currency } from "@/lib/constants";
import { resolveCurrencyByGeo } from "@/lib/geo-currency";

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
  // SSR default is USD (safe fallback). On mount we swap to the currency for
  // the visitor's IP country — India → INR, everything else → USD (follows a
  // VPN; the browser timezone doesn't). No manual switcher on public pages:
  // showing both currencies would let non-Indian visitors notice the ~$6 INR
  // price and arbitrage.
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    let cancelled = false;
    // Dev-only test override: localStorage.setItem("currency", "USD")
    let override: string | null = null;
    if (process.env.NODE_ENV !== "production") {
      try {
        override = localStorage.getItem("currency");
      } catch {}
    }
    (override === "USD" || override === "INR"
      ? Promise.resolve<Currency>(override)
      : resolveCurrencyByGeo()
    ).then((c) => {
      if (!cancelled) setCurrencyState(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem("currency", c);
    } catch {}
  };

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

