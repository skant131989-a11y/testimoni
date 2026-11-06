"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";
import { UpgradeProButton } from "@/components/upgrade-pro-button";

/**
 * Upgrade prompts for the dashboard. Both log `upgrade_nudge_viewed`
 * with the surface they sit on, and the button logs `upgrade_clicked`
 * with the same surface, so PostHog can show which spot converts.
 */

export function UpgradeNudge({
  surface,
  title,
  children,
  points,
  label = "Upgrade to Pro, $19/mo",
}: {
  surface: string;
  title: string;
  children?: React.ReactNode;
  points?: string[];
  label?: string;
}) {
  useEffect(() => {
    track("upgrade_nudge_viewed", { surface });
  }, [surface]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <p className="font-semibold">{title}</p>
        </div>
        {children && <p className="mt-1 text-sm text-muted-foreground">{children}</p>}
        {points && points.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {points.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <UpgradeProButton surface={surface} label={label} />
        <Link
          href={`/pricing?src=${encodeURIComponent(surface)}`}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          See what&rsquo;s in Pro
        </Link>
      </div>
    </div>
  );
}

/**
 * Shows real content blurred, with an unlock button on top. Used where
 * a Free user can see that more exists (and roughly how much) before
 * paying for it.
 */
export function LockedPreview({
  children,
  title,
  description,
  surface,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  surface: string;
}) {
  useEffect(() => {
    track("upgrade_nudge_viewed", { surface });
  }, [surface]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div aria-hidden className="pointer-events-none select-none opacity-70 blur-[5px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 p-4 text-center">
        <Lock className="h-5 w-5 text-primary" />
        <p className="font-semibold">{title}</p>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
        <UpgradeProButton surface={surface} size="sm" label="Unlock with Pro" />
      </div>
    </div>
  );
}
