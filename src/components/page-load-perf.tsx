"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * Fires ONE `page_load_perf` event per page mount with the browser's
 * navigation-timing numbers. Drop this in server pages that want real
 * load-time telemetry (home, dashboard, welcome).
 *
 * ─── The SPA-transition trap ───────────────────────────────────────
 * Next.js App Router uses client-side navigation. `getEntriesByType
 * ("navigation")` returns the ORIGINAL browser navigation entry — it
 * does NOT create a new entry when you router.push() or click a Link.
 * So without a guard, every page on the site reports the very first
 * page's ttfb/fcp/lcp under a different `surface` label. That's why
 * the first version of this tracker was reporting identical numbers
 * for /home and /dashboard.
 *
 * Fix: compare `nav.name` (the URL that produced the nav entry) to
 * the current `location.href`. When they match, this IS the real cold
 * load and we fire the full `page_load_perf` event. When they differ,
 * we arrived via SPA transition — we fire a separate, lighter
 * `page_transition_perf` event with just client-render time.
 *
 * ─── Fields on `page_load_perf` (cold load only) ───────────────────
 *   ttfb_ms         — server response
 *   dcl_ms          — DOMContentLoaded
 *   load_ms         — full window load (images, fonts, scripts)
 *   fcp_ms          — First Contentful Paint (first pixel)
 *   lcp_ms          — Largest Contentful Paint (main content) — via
 *                     PerformanceObserver, nullable if unsupported
 *   navigation_type — "navigate" / "reload" / "back_forward"
 *   surface         — page label ("home", "dashboard", "welcome")
 *
 * ─── Fields on `page_transition_perf` (SPA route change) ───────────
 *   client_ms       — time from route change to component mount
 *   surface         — new page label
 *   from_pathname   — previous pathname (client-only, no PII)
 *
 * ─── Sanity guards ─────────────────────────────────────────────────
 * Drops values <0 or >60_000ms — backgrounded tabs report absurd
 * numbers that skew p95 dashboards. Guards on `loadEventEnd > 0`
 * before firing so we don't report `load_ms: 0` when the effect
 * ran during the load-event window.
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
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    if (firedRef.current) return;
    if (typeof window === "undefined" || !("performance" in window)) return;

    mountTimeRef.current = performance.now();

    // ── SPA transition detection ─────────────────────────────────
    // If the nav entry's URL doesn't match ours, this is a client-
    // side route change. Fire the lighter `page_transition_perf`
    // instead of `page_load_perf` — the full-page nav numbers
    // don't apply here.
    const [navEntry] = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];

    const isColdLoad =
      !!navEntry &&
      typeof navEntry.name === "string" &&
      normalizeUrl(navEntry.name) === normalizeUrl(window.location.href);

    if (!isColdLoad) {
      firedRef.current = true;
      track(
        "page_transition_perf",
        {
          surface,
          from_pathname: previousPathnameRef.current,
          // performance.now() is 0-based from the tab's origin.
          // Not signup-to-mount latency — just "how long from
          // React render start to the effect firing". Small
          // useful signal for slow client transitions.
          client_ms: Math.round(performance.now()),
        },
        { anonymous },
      );
      previousPathnameRef.current = pathname;
      return;
    }

    // ── Cold load path: real navigation-timing metrics ──────────
    // Capture LCP via PerformanceObserver. Updates whenever a
    // larger element paints; we grab the last value at fire time.
    let lcpMs: number | null = null;
    let lcpObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver((entries) => {
        const last = entries.getEntries().at(-1);
        if (last) lcpMs = Math.round(last.startTime);
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Firefox < 122 doesn't support LCP — silently skip.
    }

    function tryFire() {
      if (firedRef.current) return;
      const [nav] = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      if (!nav) return;

      // The load event may have not populated loadEventEnd yet even
      // if document.readyState === "complete". Wait for a real
      // number before firing so we don't report load_ms: 0.
      if (nav.loadEventEnd <= 0) return;

      firedRef.current = true;
      const fcp = performance
        .getEntriesByType("paint")
        .find((e) => e.name === "first-contentful-paint");

      const ttfbMs = Math.round(nav.responseStart);
      const dclMs = Math.round(nav.domContentLoadedEventEnd);
      const loadMs = Math.round(nav.loadEventEnd);
      const fcpMs = fcp ? Math.round(fcp.startTime) : null;

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
          navigation_type: nav.type, // "navigate" | "reload" | "back_forward"
        },
        { anonymous },
      );

      lcpObserver?.disconnect();
    }

    // Fire strategy:
    //  1. If load already fired AND loadEventEnd is populated,
    //     wait one rAF for LCP to settle then fire.
    //  2. Otherwise, register load listener and re-attempt.
    //  3. In case load fired but loadEventEnd is still 0 (browser
    //     race), also poll every 100ms up to 3s.
    let pollId: ReturnType<typeof setInterval> | null = null;
    const loadHandler = () => {
      requestAnimationFrame(tryFire);
    };
    if (document.readyState === "complete") {
      requestAnimationFrame(tryFire);
      pollId = setInterval(() => {
        tryFire();
        if (firedRef.current) {
          if (pollId) clearInterval(pollId);
        }
      }, 100);
      setTimeout(() => {
        if (pollId) clearInterval(pollId);
      }, 3_000);
    } else {
      window.addEventListener("load", loadHandler, { once: true });
    }

    previousPathnameRef.current = pathname;
    return () => {
      window.removeEventListener("load", loadHandler);
      if (pollId) clearInterval(pollId);
      lcpObserver?.disconnect();
    };
  }, [surface, anonymous, pathname]);

  return null;
}

/**
 * Normalize URLs for the cold-load comparison. Some browsers store
 * `nav.name` without a trailing slash on `/`, while `location.href`
 * has it — that mismatch would incorrectly classify a real cold load
 * as an SPA transition. Also strip the hash (nav entry doesn't
 * include it, location does).
 */
function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = "";
    // Trim trailing slash from pathname unless it's the root.
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return u;
  }
}
