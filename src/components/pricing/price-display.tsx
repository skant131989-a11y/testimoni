"use client";

import { usePricing } from "@/lib/use-pricing";

interface ProPriceProps {
  suffix?: string;
  className?: string;
}

export function ProPrice({ suffix = "/mo", className }: ProPriceProps) {
  const { proMonthlyFormatted } = usePricing();
  return (
    <span className={className}>
      {proMonthlyFormatted}
      {suffix && (
        <span className="text-base font-normal text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  );
}

export function FreePrice({ suffix = "/mo", className }: ProPriceProps) {
  return (
    <span className={className}>
      ₹0
      {suffix && (
        <span className="text-base font-normal text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  );
}

/**
 * Shows ONLY the detected currency's price. Previously showed both
 * USD and INR side-by-side, which let non-Indian visitors notice
 * the INR arbitrage (₹499 ≈ $6, cheaper than $9). Auto-detection
 * means each region sees exactly one price and takes it as the
 * default. Kept the "Dual" name for API compatibility with existing
 * imports.
 */
interface ProPriceDualProps {
  suffix?: string;
  bracketClassName?: string;
  primary?: "USD" | "INR";
}

export function ProPriceDual({ suffix = "/mo", primary }: ProPriceDualProps) {
  const { currency, proMonthlyUsd, proMonthlyInr } = usePricing();
  const effective = primary ?? currency;
  const priceText = effective === "INR" ? proMonthlyInr : proMonthlyUsd;

  return (
    <>
      {priceText}
      {suffix && (
        <span className="text-base font-normal text-muted-foreground">{suffix}</span>
      )}
    </>
  );
}

/**
 * DEPRECATED — kept as a stub so any lingering imports compile.
 * The manual currency switcher is gone; region-based auto-detection
 * is the only source of truth now, which prevents arbitrage between
 * the USD and INR plans.
 */
export function CurrencySwitcher() {
  return null;
}
