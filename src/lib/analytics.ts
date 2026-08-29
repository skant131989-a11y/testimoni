import posthog from "posthog-js";

let ready = false;

/**
 * Initialize PostHog on the client. Safe to call multiple times — only
 * runs once. No-ops if env vars are missing (e.g., local dev without
 * a project set up) or if init throws for any reason.
 */
export function initAnalytics() {
  if (ready || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  try {
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      // We deliberately don't track page_view — bot traffic dominates
      // the counts pre-launch. Autocapture off keeps events explicit.
      capture_pageview: false,
      autocapture: false,
      persistence: "localStorage+cookie",
    });
    ready = true;
  } catch {
    // If PostHog fails to init, silently give up — analytics must
    // never break user flows.
  }
}

/**
 * Fire an event. All calls are wrapped in try/catch so a broken
 * analytics network / SDK bug can never block a CTA click or a
 * signup submission. capture() itself is fire-and-forget (uses
 * navigator.sendBeacon under the hood on navigations), so we don't
 * add measurable click latency.
 */
export function track(event: string, props?: Record<string, unknown>) {
  if (!ready) return;
  try {
    posthog.capture(event, props);
  } catch {
    // Swallow — never let analytics break the app.
  }
}

/** Associate the current anonymous visitor with a known user id. */
export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!ready) return;
  try {
    posthog.identify(userId, traits);
  } catch {}
}

/** Clear the current user identity — call on sign-out. */
export function resetAnalytics() {
  if (!ready) return;
  try {
    posthog.reset();
  } catch {}
}
