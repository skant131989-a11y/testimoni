"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { track, identify, resetAnalytics } from "@/lib/analytics";

/**
 * Six-digit OTP code entry for the post-send auth state.
 *
 * ─── Why this exists ────────────────────────────────────────
 * Email link scanners (Gmail, Outlook, corporate firewalls,
 * iOS's Prevent Cross-Site Tracking) prefetch every link in
 * every email to check for phishing. Each prefetch hits our
 * /callback and consumes the one-time magic-link code — so by
 * the time the human clicks the link, Supabase says "code
 * already used" and auth silently fails.
 *
 * Supabase's `signInWithOtp` emits BOTH a link and a 6-digit
 * code. The link is scanner-vulnerable; the code is not (a
 * scanner can't fill a form). Giving users both paths keeps
 * signups from silently dying to this class of failure.
 *
 * ─── UX ─────────────────────────────────────────────────────
 * Single input, 6 digits, auto-submit on 6-char fill. Works
 * with iOS's autofill-from-messages ("From Messages" bar shows
 * the code and one tap fills it). Paste of "123456" also works.
 *
 * Errors surface inline. On success:
 *   - `redirectTo` is a hard nav so fresh auth cookies land on
 *     the request the server sees (router.push races the
 *     cookie handshake — same reason /login's password path
 *     uses window.location.assign).
 *   - Consumers can pass `onSuccess` to run their own analytics
 *     before the redirect (identify(), track("signup_completed")).
 */

interface OtpCodeInputProps {
  email: string;
  redirectTo: string;
  /** Event name to fire on successful verification. */
  successEvent: string;
  /** Method label for analytics (magic_link / signup). */
  method: string;
  /** Source surface for analytics (login / signup / inline). */
  surface?: string;
  /** Optional hook to run before the redirect happens. */
  onBeforeRedirect?: (userId: string) => void;
}

export function OtpCodeInput({
  email,
  redirectTo,
  successEvent,
  method,
  surface,
  onBeforeRedirect,
}: OtpCodeInputProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus once mounted — the user's attention is on the
  // inbox but they land here first when they read the email
  // and want to type the code back.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function verify(token: string) {
    if (token.length !== 6 || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (authError || !data.session) {
        const message = authError?.message ?? "Couldn't verify that code.";
        setError(friendlyError(message));
        track("otp_verify_failed", { method, surface, reason: classify(message) });
        setVerifying(false);
        return;
      }
      // Reset any prior identity in this browser (multiple accounts,
      // account-switch) so PostHog aliases events to the fresh distinct_id.
      if (data.user?.id) {
        resetAnalytics();
        identify(data.user.id, { email });
        onBeforeRedirect?.(data.user.id);
      }
      track(successEvent, { method: `${method}_otp` }, { instant: true });
      // Hard nav — fresh auth cookies must be attached to the server
      // request that renders /dashboard or /welcome, and router.push
      // races the cookie handshake.
      window.location.assign(redirectTo);
    } catch {
      setError("Network hiccup. Try again.");
      setVerifying(false);
    }
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Or type the 6-digit code</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        The email contains a code you can type here instead of clicking the link
        — helpful if the link opens in the wrong browser or gets flagged by a
        scanner.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
        className="flex gap-2"
      >
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          minLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(next);
            setError(null);
            if (next.length === 6) verify(next);
          }}
          disabled={verifying}
          className="flex-1 font-mono text-center text-lg tracking-[0.4em]"
          aria-label="6-digit sign-in code"
        />
        <Button type="submit" disabled={code.length !== 6 || verifying}>
          {verifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function classify(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("expired")) return "expired";
  if (m.includes("invalid") || m.includes("wrong")) return "invalid";
  if (m.includes("rate")) return "rate_limited";
  return "other";
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("expired")) {
    return "That code expired. Request a fresh one below.";
  }
  if (m.includes("invalid") || m.includes("wrong")) {
    return "Wrong code. Double-check the digits in your email.";
  }
  if (m.includes("rate")) {
    return "Too many tries. Wait a minute, then try again.";
  }
  return msg;
}
