"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Turnstile } from "@/components/turnstile";
import { track } from "@/lib/analytics";

/**
 * One Turnstile gate for every auth form (signup, login, inline
 * signup, resend). It FAILS CLOSED: no token, a failed verdict or an
 * unreachable verifier all stop the action. (It used to fail open on
 * "no token", which is exactly what bots exploit — in the 28-29 Oct
 * PostHog export every bot attempt had no token and every one was let
 * through.) Real visitors still get a token silently in ~1 second.
 *
 * Verification modes:
 *  - default: the token is checked by our /api/verify-turnstile.
 *  - NEXT_PUBLIC_SUPABASE_CAPTCHA=1: Supabase's own CAPTCHA protection
 *    is switched on (Auth > Attack Protection). Then the token must be
 *    passed to Supabase as `captchaToken` (returned from verify) and
 *    must NOT be pre-verified here, because tokens are single-use.
 *    That mode is enforced by Supabase's server, so it also stops bots
 *    that skip this page and call the auth API directly.
 */

export const BLOCKER_HELP =
  "We couldn't complete the security check. Turn off any ad or privacy blocker for this page and try again, or continue with Google.";

const WAIT_MS = 8_000;

export type GateResult =
  | { ok: true; captchaToken?: string }
  | { ok: false; message: string };

export function useTurnstileGate(page: string): {
  widget: ReactNode;
  configured: boolean;
  verifying: boolean;
  verify: (action: string) => Promise<GateResult>;
  /** Call after a Supabase call that consumed a captchaToken. */
  reset: () => void;
} {
  const configured = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const supabaseCaptcha = process.env.NEXT_PUBLIC_SUPABASE_CAPTCHA === "1";
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const waiters = useRef<((t: string | null) => void)[]>([]);

  const flush = (t: string | null) => {
    const w = waiters.current;
    waiters.current = [];
    w.forEach((fn) => fn(t));
  };

  const reset = useCallback(() => {
    setToken(null);
    setResetKey((k) => k + 1);
  }, []);

  const verify = useCallback(
    async (action: string): Promise<GateResult> => {
      // Local dev without a site key: nothing to enforce. Also skip on
      // localhost itself — Cloudflare site keys are tied to hostnames, so
      // the widget usually cannot run there. Production never serves from
      // localhost, so this cannot weaken the live gate.
      const onLocalhost =
        typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
      if (!configured || onLocalhost) return { ok: true };

      let t = token;
      if (!t) {
        setVerifying(true);
        t = await new Promise<string | null>((resolve) => {
          waiters.current.push(resolve);
          setTimeout(() => resolve(null), WAIT_MS);
        });
        setVerifying(false);
      }
      if (!t) {
        track("turnstile_blocked", { action, page, reason: "no_token", enforced: true });
        return { ok: false, message: BLOCKER_HELP };
      }

      if (supabaseCaptcha) {
        // Supabase verifies it server-side; hand the token over.
        return { ok: true, captchaToken: t };
      }

      reset(); // the token below is spent; arm the widget for the next one
      try {
        const res = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: t, action }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) return { ok: true };
        const reason = data.error || "unknown";
        track("turnstile_blocked", { action, page, reason, codes: data.codes, enforced: true });
        return {
          ok: false,
          message:
            reason === "rate_limited"
              ? "Too many attempts. Please wait a minute and try again."
              : "Security check failed. Please try again in a moment.",
        };
      } catch {
        track("turnstile_blocked", { action, page, reason: "network", enforced: true });
        return { ok: false, message: "Couldn't reach the security check. Please try again." };
      }
    },
    [configured, token, supabaseCaptcha, page, reset]
  );

  const widget: ReactNode = configured ? (
    <div className="mt-4 flex justify-center">
      <Turnstile
        onToken={(t) => {
          setToken(t);
          flush(t);
        }}
        onExpire={() => setToken(null)}
        onUnavailable={(reason) => {
          track("turnstile_unavailable", { page, reason });
          flush(null);
        }}
        resetSignal={resetKey}
        appearance="interaction-only"
        size="normal"
      />
    </div>
  ) : null;

  return { widget, configured, verifying, verify, reset };
}
