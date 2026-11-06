import posthog from "posthog-js";

let ready = false;

/**
 * No personal data goes to PostHog. Users are known only by their opaque
 * Supabase id. Two layers keep emails (and the signed tokens that ride
 * along in links) out:
 *   1. identify() never sends an email or name as a person property.
 *   2. scrubEvent() runs on EVERY event just before it leaves the
 *      browser (posthog's before_send): it blanks anything that looks
 *      like an email in any property, including autocaptured element
 *      text, URLs and referrers, and redacts sensitive URL parameters.
 */
const EMAIL_RE = /[A-Za-z0-9._%+-]+(?:@|%40)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SENSITIVE_PARAMS = [
  "email",
  "e",
  "to",
  "mail",
  "user_email",
  "token",
  "code",
  "access_token",
  "refresh_token",
  "otp",
];
const PII_KEYS = /^(e-?mail|user_?email|name|full_?name|first_?name|last_?name|phone)$/i;

function scrubString(value: string): string {
  let s = value;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      let changed = false;
      for (const k of SENSITIVE_PARAMS) {
        if (u.searchParams.has(k)) {
          u.searchParams.set(k, "redacted");
          changed = true;
        }
      }
      if (changed) s = u.toString();
    } catch {}
  }
  return s.replace(EMAIL_RE, "[email]");
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (value && typeof value === "object" && depth < 5) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_KEYS.test(k)) continue;
      out[k] = scrubValue(v, depth + 1);
    }
    return out;
  }
  return value;
}

// posthog-js passes a capture result; keep the type loose on purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scrubEvent(event: any): any {
  if (!event) return event;
  try {
    if (event.properties) event.properties = scrubValue(event.properties);
    if (event.$set) event.$set = scrubValue(event.$set);
    if (event.$set_once) event.$set_once = scrubValue(event.$set_once);
  } catch {}
  return event;
}

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
      // Last stop before an event leaves the browser. See scrubEvent().
      before_send: scrubEvent,
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

/**
 * Associate the current anonymous visitor with a known user id. Only
 * the opaque id is used as identity; email, name and similar traits are
 * dropped here so they can never become person properties.
 */
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
    const safe = traits ? (scrubValue(traits) as Record<string, unknown>) : undefined;
    posthog.identify(userId, safe && Object.keys(safe).length > 0 ? safe : undefined);
  } catch {}
}

/**
 * One-time cleanup for people identified before this change: removes the
 * email/name person properties PostHog already holds for them. Runs once
 * per browser; harmless if there is nothing to remove.
 */
export function clearLegacyPersonPii() {
  if (!ready || isPublicPath()) return;
  try {
    const flag = "testimoni_ph_pii_cleared_v1";
    if (localStorage.getItem(flag)) return;
    posthog.capture("$set", { $unset: ["email", "name", "first_name", "last_name"] });
    localStorage.setItem(flag, "1");
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
