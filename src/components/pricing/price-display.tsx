"use client";

import { usePricing } from "@/lib/use-pricing";

/**
 * Founding member pricing — the visible $9/mo (₹499) is a locked-in
 * "founding rate" available only until Dec 31, 2026. New signups after
 * that date will pay the regular price. Existing founding members keep
 * $9 forever.
 */
export const FOUNDING_MEMBER_DEADLINE = "Dec 31, 2026";
const REGULAR_USD = "$20";
const REGULAR_INR = "₹1099";

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
  const regularText = effective === "INR" ? REGULAR_INR : REGULAR_USD;

  return (
    <>
      <span className="mr-2 text-lg font-normal text-muted-foreground line-through">
        {regularText}
      </span>
      {priceText}
      {suffix && (
        <span className="text-base font-normal text-muted-foreground">{suffix}</span>
      )}
    </>
  );
}

/**
 * Small badge that anchors the "founding member" story next to the
 * struck-through Pro price. Use next to a ProPriceDual on marketing
 * cards to explain WHY the price is discounted.
 */
export function FoundingBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary ${className}`}
    >
      ★ Founding member
    </span>
  );
}

/**
 * One-line explainer that goes UNDER the price — spells out the
 * lock-in and the deadline in plain English. Standardized here so
 * every pricing card, home page, and comparison page reads the same.
 */
export function FoundingExplainer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      Locked in for life if you sign up before {FOUNDING_MEMBER_DEADLINE}. New
      signups after that pay full price; founding members stay at the same rate
      forever.
    </p>
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
