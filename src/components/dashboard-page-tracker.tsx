"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { PageEngagement } from "@/components/page-engagement";
import { track } from "@/lib/analytics";

/**
 * Dashboard-wide page tracker.
 *
 * Mounted inside the dashboard layout so every authenticated route
 * (/dashboard, /dashboard/inbox, /dashboard/welcome, /dashboard/widgets/[id],
 *  etc.) auto-fires:
 *   - `dashboard_page_viewed` on mount / on route change (client-side nav)
 *   - `time_on_page` heartbeats via PageEngagement — surfaced with the
 *     current pathname so PostHog can filter by dashboard page
 *
 * No code changes required in individual dashboard pages.
 *
 * Route changes: Next.js client-side navigation does NOT unmount the
 * layout, so we watch usePathname() and re-fire page_viewed when it
 * changes. PageEngagement is re-keyed on the same pathname so its
 * scroll/time counters reset per route.
 */
export function DashboardPageTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    track("dashboard_page_viewed", { pathname });
  }, [pathname]);

  // key={pathname} — remount PageEngagement on route change so scroll
  // + time timers reset per dashboard route.
  return <PageEngagement key={pathname} surface={`dashboard:${pathname}`} />;
}
