"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/**
 * Fires ONE `page_load_perf` event per page mount with the browser's
 * own navigation-timing numbers. Drop this in server pages that want
 * real load-time telemetry (home, dashboard, welcome).
 *
 * What each field means:
 *   ttfb_ms    — server-response time. Time from nav start until the
 *                first byte of the document arrived. This is the
 *                clearest "is the backend slow?" signal.
 *   dcl_ms     — DOMContentLoaded. HTML parsed + sync scripts done.
 *   load_ms    — full window "load" event: images, fonts, scripts.
 *   fcp_ms    — First Contentful Paint. When the user first sees
 *                anything painted (text, image, etc.).
 *   lcp_ms    — Largest Contentful Paint. When the main above-the-
 *                fold content appears. Best "page feels ready"
 *                proxy. Nullable — captured via PerformanceObserver
 *                and may not resolve if the page unmounts fast.
 *   navigation_type — "navigate", "reload", "back_forward",
 *                or "prerender". Filter to "navigate" for clean
 *                cold-load percentiles.
 *   surface — passed by the caller so events from different pages
 *                can be sliced apart (home vs dashboard vs welcome).
 *
 * All numbers are milliseconds since navigation start (Performance
 * API standard). Skips events with negative or absurd numbers
 * (>60_000ms) which usually mean the tab was backgrounded — those
 * pollute p95 metrics.
 *
 * Fires exactly once per mount via the fired ref. If the same page
 * is re-rendered by parent state, we don't emit a duplicate.
 */
export function PageLoadPerf({
  surface,
  anonymous = false,
}: {
  surface: string;
  /** For PUBLIC surfaces (home, wall) so events don't inherit the
   *  logged-in workspace owner's identity when they visit their
   *  own marketing site. Dashboard + welcome should leave false. */
  anonymous?: boolean;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (typeof window === "undefined" || !("performance" in window)) return;

    // Capture LCP via PerformanceObserver. LCP updates whenever a
    // larger element gets painted, so we track the latest and use it
    // when we fire. Some browsers (older Firefox / Safari) don't
    // support this entryType — we silently skip and lcp_ms stays null.
    let lcpMs: number | null = null;
    let lcpObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver((entries) => {
        const last = entries.getEntries().at(-1);
        if (last) lcpMs = Math.round(last.startTime);
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // browser doesn't support LCP — no-op
    }

    function fire() {
      if (firedRef.current) return;
      firedRef.current = true;

      const [nav] = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      if (!nav) return;

      // FCP lives in the "paint" entry type, not navigation timing.
      const fcp = performance
        .getEntriesByType("paint")
        .find((e) => e.name === "first-contentful-paint");

      const ttfbMs = Math.round(nav.responseStart);
      const dclMs = Math.round(nav.domContentLoadedEventEnd);
      const loadMs = Math.round(nav.loadEventEnd);
      const fcpMs = fcp ? Math.round(fcp.startTime) : null;

      // Sanity filter — backgrounded tabs report values in the tens
      // of thousands and skew p95 dashboards. Also drops the -1 /
      // 0 that browsers return when timing wasn't captured.
      const sane = (n: number | null) =>
        n !== null && n >= 0 && n < 60_000 ? n : null;

      track(
        "page_load_perf",
        {
          surface,
          ttfb_ms: sane(ttfbMs),
          dcl_ms: sane(dclMs),
          load_ms: sane(loadMs),
          fcp_ms: sane(fcpMs),
          lcp_ms: sane(lcpMs),
          navigation_type: nav.type, // "navigate" | "reload" | "back_forward" | "prerender"
        },
        { anonymous },
      );

      lcpObserver?.disconnect();
    }

    // Fire after the window "load" event so loadEventEnd is
    // populated. If load already fired before this effect ran
    // (fast page + late React mount), fire immediately.
    if (document.readyState === "complete") {
      // rAF gives LCP one more tick to settle. Cheap, invisible.
      requestAnimationFrame(fire);
    } else {
      window.addEventListener("load", fire, { once: true });
      return () => window.removeEventListener("load", fire);
    }
  }, [surface, anonymous]);

  return null;
}
