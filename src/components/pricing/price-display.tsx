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

/**
 * Shows USD as primary + INR in muted brackets next to it (or vice-versa).
 * Follows the current currency preference: if user picks INR, INR becomes primary.
 * Pass `primary` to force a specific currency (used on public marketing pages).
 */
interface ProPriceDualProps {
  suffix?: string;
  bracketClassName?: string;
  primary?: "USD" | "INR";
}

export function ProPriceDual({ suffix = "/mo", bracketClassName, primary }: ProPriceDualProps) {
  const { currency, proMonthlyUsd, proMonthlyInr } = usePricing();
  const effective = primary ?? currency;
  const primaryText = effective === "INR" ? proMonthlyInr : proMonthlyUsd;
  const secondaryText = effective === "INR" ? proMonthlyUsd : proMonthlyInr;

  return (
    <>
      {primaryText}
      {suffix && (
        <span className="text-base font-normal text-muted-foreground">{suffix}</span>
      )}
      <span
        className={
          bracketClassName ??
          "ml-2 align-middle text-base font-normal text-muted-foreground"
        }
      >
        (≈ {secondaryText})
      </span>
    </>
  );
}

export function CurrencySwitcher() {
  const { currency, setCurrency } = usePricing();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border bg-background p-1 text-xs">
      <button
        type="button"
        onClick={() => setCurrency("USD")}
        className={`rounded-full px-3 py-1 transition ${
          currency === "USD"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        USD
      </button>
      <button
        type="button"
        onClick={() => setCurrency("INR")}
        className={`rounded-full px-3 py-1 transition ${
          currency === "INR"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        INR
      </button>
    </div>
  );
}
