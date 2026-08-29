"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/**
 * Client-side analytics bootstrap. Initializes PostHog on mount.
 *
 * We deliberately don't track page_view — bot traffic dominates the
 * counts pre-launch and turns every funnel denominator into noise.
 * Instead we track only user-triggered events (cta_clicked,
 * signup_started, form_created, etc.) which bots can't fake.
 */
export function AnalyticsInit() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
