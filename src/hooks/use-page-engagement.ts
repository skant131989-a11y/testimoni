"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/**
 * Fire scroll_depth and time_on_page events for engagement analytics.
 * Each threshold fires once per mount (not per session — enough for
 * measuring what percentage of visitors reach each threshold on a
 * single page load, which is what we actually care about).
 *
 * Usage:
 *   useEffect(() => usePageEngagement({ surface: "home" }), []);
 *
 * Or as a hook (auto-runs on mount, cleans up on unmount):
 *   usePageEngagement({ surface: "home" });
 *
 * Passive listeners so we never block scroll performance.
 */
export function usePageEngagement({ surface }: { surface: string }) {
  // Track which thresholds already fired so we don't spam.
  const firedScroll = useRef<Set<number>>(new Set());
  const firedTime = useRef<Set<number>>(new Set());

  useEffect(() => {
    const SCROLL_THRESHOLDS = [25, 50, 75, 100];
    const TIME_THRESHOLDS = [10, 30, 60];

    function checkScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const pct = Math.min(
        100,
        Math.round((doc.scrollTop / scrollable) * 100),
      );
      for (const t of SCROLL_THRESHOLDS) {
        if (pct >= t && !firedScroll.current.has(t)) {
          firedScroll.current.add(t);
          track("scroll_depth", { pct: t, surface });
        }
      }
    }

    // Time thresholds — one timer per bucket. We DON'T use a single
    // interval because that'd fire on tabs left backgrounded; setTimeout
    // batches with the browser's throttling so hidden tabs don't
    // pollute analytics as much.
    const timeouts: ReturnType<typeof setTimeout>[] = TIME_THRESHOLDS.map(
      (seconds) =>
        setTimeout(() => {
          if (document.visibilityState === "visible") {
            firedTime.current.add(seconds);
            track("time_on_page", { seconds, surface });
          }
        }, seconds * 1000),
    );

    window.addEventListener("scroll", checkScroll, { passive: true });
    // Fire an initial check in case the page loaded already scrolled
    // (e.g. anchor navigation).
    checkScroll();

    return () => {
      window.removeEventListener("scroll", checkScroll);
      timeouts.forEach(clearTimeout);
    };
  }, [surface]);
}
