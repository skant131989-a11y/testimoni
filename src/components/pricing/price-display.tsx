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
  const { currency } = usePricing();
  const symbol = currency === "INR" ? "₹" : "$";
  return (
    <span className={className}>
      {symbol}0
      {suffix && (
        <span className="text-base font-normal text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  );
}

/**
 * Pro AI tier price — the $29/mo (₹1499) intelligence tier. No
 * founding-member discount here (this is a new tier launched
 * 2026-09; the price IS the price). Same auto-currency detection.
 */
export function ProAiPrice({ suffix = "/mo", className }: ProPriceProps) {
  const { proAiMonthlyFormatted } = usePricing();
  return (
    <span className={className}>
      {proAiMonthlyFormatted}
      {suffix && (
        <span className="text-base font-normal text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
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
