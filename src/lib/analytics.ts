import posthog from "posthog-js";

let ready = false;

// Dev-only trace: NEXT_PUBLIC_ vars are inlined at build time, so
// process.env.NODE_ENV works client-side.
const DEBUG = process.env.NODE_ENV === "development";

/**
 * Route prefixes that must NEVER carry the workspace owner's identity
 * out to PostHog. The workspace owner often visits their own public
 * pages (wall, collect form, marketing) in the same browser session
 * they were logged into the dashboard from — without this guard,
 * PostHog attaches their email to every anonymous-visitor event on
 * those pages, breaking funnels and leaking PII into shared analytics.
 *
 * Kept in one place so `track()`, `initAnalytics()`, and the
 * route-change guard all agree on what "public" means.
 */
const PUBLIC_PATH_PREFIXES = [
  "/w/",       // hosted Wall of Love
  "/collect/", // hosted collection forms
  "/tools/",   // free tools
  "/for/",     // niche landing pages
  "/demo",     // demo playground
  "/pricing",  // marketing
  "/login",    // pre-auth
  "/signup",   // pre-auth
  "/forgot-password",
  "/reset-password",
];

const PUBLIC_EXACT_PATHS = new Set(["/", "/pricing"]);

/**
 * True if the current window location is a page a non-logged-in
 * visitor could land on. SSR-safe (returns false when there is no
 * window — server-side analytics never fires anyway).
 */
export function isPublicPath(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  if (PUBLIC_EXACT_PATHS.has(path)) return true;
  return PUBLIC_PATH_PREFIXES.some((p) => path.startsWith(p));
}

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
      // We keep capture_pageview OFF and fire $pageview manually
      // from <PageviewTracker /> — that lets us reset the identity
      // FIRST when the route lands on a public path, so pageview
      // events never leak the workspace owner's id on /w/, /tools/,
      // /for/ etc. See src/components/pageview-tracker.tsx.
      capture_pageview: false,
      // Pageleave gives PostHog Web Analytics accurate session
      // duration + bounce rate. Cheap to enable — one event per
      // page + on unload.
      capture_pageleave: true,
      // Autocapture: clicks, form submits, top-clicked selectors.
      // Powers PostHog's Web Analytics "top clicks" + funnels
      // without us having to instrument every button by hand.
      autocapture: true,
      // Anonymous visitors DON'T create person profiles — they
      // still count in Web Analytics (unique visitors, pageviews,
      // sessions) but don't burn person-profile quota or store PII.
      // identify() still promotes to identified profile for
      // logged-in users. Recommended default in PostHog docs.
      person_profiles: "identified_only",
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
        // Landed on a public page while PostHog still holds an
        // identified user in its localStorage/cookie? Wipe that
        // identity NOW so nothing on this page can send events
        // attributed to the logged-in workspace owner. When the
        // user navigates back to /dashboard, AuthIdentifier
        // re-identifies them.
        if (isPublicPath()) {
          try {
            posthog.reset();
            if (DEBUG)
              console.log(
                "[analytics] reset PostHog identity on public path"
              );
          } catch {}
        }
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
    // Defense in depth: any event fired from a public URL is
    // FORCED anonymous — even if the caller forgot to pass the
    // anonymous flag. Prevents the workspace owner's email leaking
    // into anonymous-visitor funnels on /w, /tools, /collect, etc.
    const forceAnonymous = isPublicPath();
    const anonymous = options?.anonymous || forceAnonymous;

    const captureOptions: Record<string, unknown> = {};
    if (options?.instant) captureOptions.send_instantly = true;
    if (anonymous) {
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
  // Never identify from a public URL. Signup/login pages redirect to
  // /dashboard after auth, and AuthIdentifier re-identifies there —
  // but a stray identify() from a public surface would immediately
  // re-attach PII to the current tab's events.
  if (isPublicPath()) {
    if (DEBUG)
      console.log("[analytics] identify skipped — on public path");
    return;
  }
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
