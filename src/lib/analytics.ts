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
 */
export function track(
  event: string,
  props?: Record<string, unknown>,
  options?: { instant?: boolean },
) {
  if (DEBUG) console.log(`[analytics] track(${event}) ready=${ready}`, props);
  if (!ready) return;
  try {
    if (options?.instant) {
      posthog.capture(event, props, { send_instantly: true });
    } else {
      posthog.capture(event, props);
    }
  } catch (e) {
    if (DEBUG) console.warn("[analytics] capture threw", e);
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
