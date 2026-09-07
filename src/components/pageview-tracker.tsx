"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { isPublicPath } from "@/lib/analytics";

/**
 * Fires PostHog $pageview events on every route change so PostHog Web
 * Analytics has the full pageview stream it needs to compute pageviews,
 * sessions, bounce rate, top pages, referrers, devices, and geos.
 *
 * We do this manually (init has `capture_pageview: false`) so we can
 * RESET PostHog's identity FIRST when the new route is a public path.
 * Without this, a user who navigates from /dashboard to /w/mywall via
 * client-side nav would keep their identified distinct_id — leaking
 * the workspace owner's email into events fired on the public wall.
 *
 * Runs inside <Suspense> because Next 15 requires useSearchParams
 * to have a Suspense boundary around it (streaming behavior).
 */
function PageviewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Track the last URL we captured so React's double-render in dev
  // mode doesn't fire two $pageview events for the same navigation.
  const lastCaptured = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    if (url === lastCaptured.current) return;
    lastCaptured.current = url;

    // Public paths: wipe identity BEFORE capture so the $pageview
    // event ships with a fresh anonymous distinct_id, not the
    // workspace owner's identified one. AuthIdentifier re-runs
    // when the visitor navigates back into /dashboard.
    // isPublicPath() reads window.location.pathname, which has
    // already been updated to the new URL by the time this effect
    // fires (Next router pushes state before re-rendering).
    if (isPublicPath()) {
      try {
        posthog.reset();
      } catch {
        // Silent — analytics reset failure must never break navigation.
      }
    }

    try {
      posthog.capture("$pageview", {
        $current_url: window.location.href,
      });
    } catch {
      // Silent — same reason as above.
    }
  }, [pathname, searchParams]);

  return null;
}

export function PageviewTracker() {
  return (
    <Suspense fallback={null}>
      <PageviewTrackerInner />
    </Suspense>
  );
}
