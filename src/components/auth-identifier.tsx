"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { identify, resetAnalytics } from "@/lib/analytics";

/**
 * Rendered from the dashboard root layout. Ensures the current
 * Supabase user is the one PostHog thinks is logged in. Handles:
 *
 * - Google OAuth flow — signup/login pages can't identify because
 *   the redirect happens server-side; this mounts after callback
 *   completes and the user lands on /dashboard/*.
 * - Account switching — if a previous user was identified in this
 *   browser and someone else logs in, resets first then identifies
 *   fresh so events attach to the correct person.
 * - Session-persisted logins — user visits directly with an
 *   existing cookie; we still want to link events to them.
 *
 * We track the last user id in a module-level ref so navigating
 * between dashboard pages doesn't call identify() on every render.
 */
export function AuthIdentifier({ userId }: { userId: string | null }) {
  const lastIdentified = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (lastIdentified.current === userId) return;
    // If we previously identified a DIFFERENT user in this session,
    // reset before re-identifying so PostHog doesn't alias events
    // to the old identity.
    if (lastIdentified.current && lastIdentified.current !== userId) {
      resetAnalytics();
    }
    // Grab the current user's email for identify traits — cheap since
    // Supabase caches this in memory after any prior getUser call.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id === userId) {
        identify(userId, { email: data.user.email ?? undefined });
        lastIdentified.current = userId;
      }
    });
  }, [userId]);

  return null;
}
