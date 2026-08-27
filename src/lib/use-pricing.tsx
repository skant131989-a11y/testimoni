"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectCurrency, formatPrice, PRICING, type Currency } from "@/lib/constants";

interface PricingContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  proMonthly: number;
  proMonthlyFormatted: string;
  proMonthlyUsd: string;
  proMonthlyInr: string;
}

const PricingContext = createContext<PricingContextValue | null>(null);

export function PricingProvider({ children }: { children: ReactNode }) {
  // Default to USD everywhere. Users can switch manually via CurrencySwitcher.
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("currency") : null;
    if (stored === "USD" || stored === "INR") {
      setCurrencyState(stored);
    }
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

  return (
    <PricingContext.Provider
      value={{
        currency,
        setCurrency,
        proMonthly,
        proMonthlyFormatted,
        proMonthlyUsd,
        proMonthlyInr,
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
    };
  }
  return ctx;
}

// Expose detectCurrency for callers that want to opt into geo-based defaults.
export { detectCurrency };

