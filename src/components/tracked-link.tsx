"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track } from "@/lib/analytics";

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  /** Short slug identifying which CTA this is, e.g. "hero_get_started". */
  cta: string;
  /** Marketing surface — home, pricing, demo, wall_demo, blog, 404. */
  surface: string;
}

/**
 * next/link wrapper that fires a cta_clicked event before navigating.
 *
 * Navigation-safety notes:
 * - track() is wrapped in try/catch (defined in analytics.ts) — a
 *   thrown SDK error can never stop the click.
 * - posthog.capture() is fire-and-forget: it queues the event and
 *   returns synchronously in microseconds. The actual HTTP request
 *   uses navigator.sendBeacon() which the browser flushes during
 *   navigation without blocking it.
 * - We do NOT preventDefault or await anything, so next/link's
 *   client-side navigation happens on the same tick as always.
 */
export function TrackedLink({ cta, surface, onClick, ...rest }: TrackedLinkProps) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        try {
          // instant: true — post via sendBeacon immediately, don't batch.
          // If we let PostHog queue it for the 30s batch, the click's
          // page navigation would tear down the tab before the flush.
          track(
            "cta_clicked",
            { cta, surface, href: String(rest.href ?? "") },
            { instant: true },
          );
        } catch {
          // Should be unreachable — track() already catches — but keeps
          // navigation guaranteed even if imports break.
        }
        onClick?.(e);
      }}
    />
  );
}
