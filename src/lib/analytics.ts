import posthog from "posthog-js";

let ready = false;

// Dev-only trace: NEXT_PUBLIC_ vars are inlined at build time, so
// process.env.NODE_ENV works client-side.
const DEBUG = process.env.NODE_ENV === "development";

/**
 * Initialize PostHog on the client. Safe to call multiple times — only
 * runs once. No-ops if env vars are missing (e.g., local dev without
 * a project set up) or if init throws for any reason.
 */
export function initAnalytics() {
  if (DEBUG) console.log("[analytics] initAnalytics called, ready=", ready);
  if (ready || typeof window === "undefined") return;

  // Skip PostHog entirely on localhost and NODE_ENV=development so
  // dev clicks don't burn events against the Free plan's monthly
  // quota. Every track() call becomes a no-op because `ready` stays
  // false. Set NEXT_PUBLIC_POSTHOG_ALLOW_LOCAL=1 in .env.local to
  // opt in when you actually want to test event wiring locally.
  const allowLocal = process.env.NEXT_PUBLIC_POSTHOG_ALLOW_LOCAL === "1";
  const host = window.location.hostname;
  const isLocalHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local");
  if ((DEBUG || isLocalHost) && !allowLocal) {
    if (DEBUG) console.log("[analytics] skipping PostHog on local/dev");
    return;
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (DEBUG) console.log("[analytics] key present?", !!key);
  if (!key) return;

  // Suppress the known posthog-js + React 19 web-vitals bug:
  // "Cannot read properties of undefined (reading 'startTime')".
  // It comes from posthog's async web-vitals reporter and can't be
  // reliably disabled via config in this SDK version. Left uncaught,
  // it pollutes the console AND some browsers throttle subsequent
  // React work when an uncaught error fires inside requestIdleCallback,
  // which was making dashboard navigation feel slow.
  //
  // We swallow BOTH the direct error and the unhandledrejection form
  // (async reporter uses microtasks that can slip past window.error).
  function isPostHogVitalsError(msg: string, stack: string): boolean {
    return (
      msg.includes("startTime") ||
      msg.includes("reportAllChanges") ||
      stack.includes("reportAllChanges") ||
      stack.includes("web_vitals") ||
      stack.includes("posthog")
    );
  }
  window.addEventListener("error", (e) => {
    const msg = e.message ?? "";
    const stack = e.error?.stack ?? "";
    if (isPostHogVitalsError(msg, stack)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    const msg = typeof reason === "string" ? reason : reason?.message ?? "";
    const stack = reason?.stack ?? "";
    if (isPostHogVitalsError(msg, stack)) {
      e.preventDefault();
    }
  });

  try {
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      capture_pageview: false,
      autocapture: false,
      persistence: "localStorage+cookie",
      // Full-stack shutdown of the perf/vitals + recording features
      // we don't use. The nested capture_performance object is what
      // this SDK version actually reads for web_vitals.
      capture_performance: {
        network_timing: false,
        web_vitals: false,
      },
      disable_session_recording: true,
      disable_surveys: true,
      loaded: () => {
        if (DEBUG) console.log("[analytics] posthog loaded");
      },
    });
    ready = true;
    if (DEBUG) console.log("[analytics] init OK, ready=true");
  } catch (e) {
    if (DEBUG) console.warn("[analytics] init threw", e);
  }
}

/**
 * Fire an event. All calls are wrapped in try/catch so a broken
 * analytics network / SDK bug can never block a CTA click or a
 * signup submission.
 *
 * Pass `instant: true` for events that fire immediately before a
 * navigation (CTA clicks, signup buttons that redirect to OAuth) —
 * this forces PostHog to POST right away via sendBeacon instead of
 * queuing for its 30-second batch, so the event isn't dropped when
 * the page unloads. Non-instant tracks (form_published, logout,
 * signup_completed on a landed page) can safely batch.
 *
 * Pass `anonymous: true` for events fired on PUBLIC pages that
 * should never be attributed to the current logged-in user (e.g.
 * anonymous form_viewed on a workspace's public collect form, or
 * page_view on a shared /w/[widgetId] wall). PostHog otherwise
 * attaches the logged-in user's identity to every event fired from
 * that browser session, which pollutes anonymous-visitor funnels
 * when the workspace owner tests their own public pages. We attach
 * a session-scoped random distinct_id (one per browser tab per
 * public surface) instead, and keep the logged-in identity intact
 * for regular in-app events.
 */
export function track(
  event: string,
  props?: Record<string, unknown>,
  options?: { instant?: boolean; anonymous?: boolean },
) {
  if (DEBUG) console.log(`[analytics] track(${event}) ready=${ready}`, props);
  if (!ready) return;
  try {
    const captureOptions: Record<string, unknown> = {};
    if (options?.instant) captureOptions.send_instantly = true;
    if (options?.anonymous) {
      // Force this event to leave the logged-in identity out.
      // $process_person_profile: false tells PostHog to skip the
      // user profile merge for this specific event.
      captureOptions.$process_person_profile = false;
      // Anonymous distinct_id scoped to this tab session so
      // form_viewed and form_submitted from the same visitor group
      // together for funnel analysis.
      captureOptions.distinct_id = getAnonymousDistinctId();
    }
    posthog.capture(event, props, captureOptions);
  } catch (e) {
    if (DEBUG) console.warn("[analytics] capture threw", e);
    // Swallow — never let analytics break the app.
  }
}

/**
 * Per-tab anonymous distinct_id. Kept in sessionStorage so events
 * within one tab's lifetime group together (form_viewed and
 * form_submitted from the same visitor share a distinct_id) but
 * don't leak across tabs or persist after the tab is closed.
 */
function getAnonymousDistinctId(): string {
  if (typeof window === "undefined") return `anon-${Date.now()}`;
  try {
    const key = "testimoni_anon_distinct_id";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `anon-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

/** Associate the current anonymous visitor with a known user id. */
export function identify(userId: string, traits?: Record<string, unknown>) {
  if (DEBUG) console.log(`[analytics] identify(${userId}) ready=${ready}`, traits);
  if (!ready) return;
  try {
    posthog.identify(userId, traits);
  } catch {}
}

/** Clear the current user identity — call on sign-out. */
export function resetAnalytics() {
  if (DEBUG) console.log(`[analytics] reset() ready=${ready}`);
  if (!ready) return;
  try {
    posthog.reset();
  } catch {}
}
