"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Small "3 of 10 used" chip that lives next to a resource action
 * (Add testimonial, Create widget, Add form). On Free plan we show
 * progressive nudges as the user approaches the cap:
 *
 *  - <70% full: quiet "3/10 · Free plan" line
 *  - >=70% full: warns "8/10 — 2 left on Free"
 *  - at cap: hard block "10/10 — Pro unlocks unlimited"
 *
 * Pro plan hides entirely (limit is Infinity). The point isn't to
 * shame the user; it's to make the cap visible enough that the
 * upgrade decision happens naturally at the moment of value, not on
 * a pricing page detour.
 */
export function PlanLimitProgress({
  current,
  max,
  resource,
  upgradeSurface,
}: {
  current: number;
  max: number;
  /** Plural noun: "testimonials", "widgets", "forms", "videos". */
  resource: string;
  /** Where the chip is being rendered — passed to the upgrade link
   *  as ?src=<surface> for attribution. */
  upgradeSurface: string;
}) {
  if (!isFinite(max)) return null; // Pro — no cap to show
  const remaining = Math.max(0, max - current);
  const pct = max === 0 ? 100 : Math.min(100, Math.round((current / max) * 100));
  const atCap = current >= max;
  const nearing = pct >= 70 && !atCap;

  const tone = atCap
    ? "border-primary bg-primary/10 text-primary"
    : nearing
      ? "border-primary/40 bg-primary/5 text-primary"
      : "border bg-muted/40 text-muted-foreground";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
    >
      <Sparkles className="h-3 w-3" />
      <span>
        {atCap ? (
          <>
            {current}/{max} {resource} — Pro unlocks unlimited
          </>
        ) : nearing ? (
          <>
            {current}/{max} {resource} — {remaining} left on Free
          </>
        ) : (
          <>
            {current}/{max} {resource} · Free plan
          </>
        )}
      </span>
      {(nearing || atCap) && (
        <Link
          href={`/dashboard/settings/billing?src=${encodeURIComponent(upgradeSurface)}`}
          className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}
