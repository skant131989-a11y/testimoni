"use client";

import { usePricing } from "@/lib/use-pricing";

interface ProPriceProps {
  suffix?: string;
  className?: string;
}

export function ProPrice({ suffix = "/mo", className }: ProPriceProps) {
  const { proMonthlyFormatted, proMonthlyList } = usePricing();
  return (
    <span className={className}>
      {proMonthlyList && (
        <span className="mr-2 text-xl font-normal text-muted-foreground line-through">{proMonthlyList}</span>
      )}
      {proMonthlyFormatted}
      {suffix && (
        <span className="text-base font-normal text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  );
}

/** Shown only to visitors on rupee pricing: says it plainly, so it is not a surprise. */
export function ProPriceNote({ className }: { className?: string }) {
  const { currency, proMonthlyUsd, proMonthlyList, proMonthlyFormatted } = usePricing();
  if (currency !== "INR") return null;
  return (
    <p className={className ?? "mt-1 text-xs text-muted-foreground"}>
      <span className="font-semibold text-emerald-700">Launch offer for India:</span>{" "}
      {proMonthlyFormatted}/month{proMonthlyList ? ` from the regular ${proMonthlyList}` : ""}, billed in rupees.
      Everywhere else Pro is {proMonthlyUsd}/month. Same plan.
    </p>
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
