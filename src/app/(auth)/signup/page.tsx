"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track, identify, resetAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@/components/turnstile";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

/**
 * Signup page — reworked 2026-09.
 *
 * Google is the primary path. Email + password is the fallback for
 * founders who don't want to use Google. Magic link was removed —
 * it depended on Resend/email delivery, which was killing conversion
 * during the bot-driven email quota exhaustion.
 *
 * Email verification is expected to be DISABLED in Supabase Auth
 * settings (Authentication → Providers → Email → toggle off
 * "Confirm email"). With that off, signUp returns a valid session
 * immediately and we can drop the user straight into /dashboard/welcome.
 *
 * ── Anti-bot ─────────────────────────────────────────────────────
 * As of 2026-09-27: the honeypot and the mount-timestamp check are
 * telemetry only — never block. Turnstile is telemetry-only for every
 * outcome *except* a real negative verdict from Cloudflare
 * (`verify_failed`) — see the note above `verifyTurnstile` for why
 * that one line is drawn there.
 */

export default function SignupPage() {
  const searchParams = useSearchParams();
  const isImportFlow = searchParams.get("import") === "1";
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [botTrap, setBotTrap] = useState("");
  const [mountedAt] = useState(() => Date.now());
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const turnstileConfigured = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [verifyingTurnstile, setVerifyingTurnstile] = useState(false);
  // Resolved by the Turnstile onToken/onUnavailable callbacks below —
  // lets verifyTurnstile await a token that arrives shortly after
  // submit instead of only ever seeing whatever token existed at the
  // exact moment of the click.
  const tokenWaitersRef = useRef<((token: string | null) => void)[]>([]);
  const TURNSTILE_WAIT_MS = 8_000;

  /**
   * Real users were getting bounced by every layer of this check:
   * the widget's own no-token race (loading right as an autofilled
   * form submitted), and — per PostHog on 2026-09-27 — a chunk of
   * real visitors whose Turnstile check silently times out, most
   * likely an ad blocker or privacy extension blocking Cloudflare's
   * background verification calls specifically (the widget script
   * itself still loads fine). Neither of those is a bot signal, it's
   * "we couldn't get an answer" — so we no longer block on them.
   *
   * The one signal that IS trustworthy is a `verify_failed` response:
   * Cloudflare actually ran the check and came back with a real
   * negative verdict. That's the only outcome this function blocks
   * on. Everything else (no token in time, our own endpoint
   * unreachable/misconfigured/rate-limited) fails open.
   */
  async function verifyTurnstile(action: string): Promise<boolean> {
    if (!turnstileConfigured) return true;
    let token = turnstileToken;
    if (!token) {
      setVerifyingTurnstile(true);
      token = await new Promise<string | null>((resolve) => {
        tokenWaitersRef.current.push(resolve);
        setTimeout(() => resolve(null), TURNSTILE_WAIT_MS);
      });
      setVerifyingTurnstile(false);
    }
    if (!token) {
      // Widget never produced a token — inconclusive, not a bot
      // signal. See the note above.
      track("turnstile_blocked", { action, reason: "no_token", enforced: false });
      return true;
    }
    setTurnstileToken(null);
    setTurnstileResetKey((k) => k + 1); // arm the widget for a fresh token next time
    try {
      const res = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const data = await res.json();
      if (res.ok && data.ok) return true;
      if (data.error === "verify_failed") {
        // Cloudflare actually judged this token invalid — the one
        // real block left in this flow.
        track("turnstile_blocked", { action, reason: "verify_failed", codes: data.codes, enforced: true });
        setError("Security check failed. Please try again in a moment.");
        return false;
      }
      // Any other failure (rate_limited, invalid_body, our own
      // endpoint unreachable) is our infrastructure, not a verdict on
      // this visitor — fail open.
      track("turnstile_blocked", { action, reason: data.error || "unknown", enforced: false });
      return true;
    } catch {
      // Network fluke reaching our own /api/verify-turnstile — fail
      // open, same reasoning.
      return true;
    }
  }

  async function handleEmailSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (botTrap) {
      // Logged, not blocked — see the anti-bot note above. Clear it
      // so a one-off autofill doesn't keep tripping for the rest of
      // this visit.
      track("signup_rejected", { reason: "honeypot", method: "email", enforced: false });
      setBotTrap("");
    }
    if (Date.now() - mountedAt < 800) {
      track("signup_rejected", { reason: "too_fast", method: "email", enforced: false });
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    // Only blocks on a real Cloudflare "verify_failed" verdict — see
    // the note above verifyTurnstile.
    if (!(await verifyTurnstile("signup_email"))) return;

    setIsEmailLoading(true);
    track(
      "signup_started",
      { method: "email_password", source: "signup_page" },
      { instant: true },
    );

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        // Nicer copy for the most common friendly-fire errors.
        const raw = authError.message.toLowerCase();
        if (raw.includes("already registered") || raw.includes("already exists")) {
          setError(
            "That email is already registered. Try signing in instead.",
          );
        } else if (raw.includes("weak") || raw.includes("password")) {
          setError(
            "Password too weak — try 8+ chars with a mix of letters and numbers.",
          );
        } else {
          setError(authError.message);
        }
        track("signup_failed", {
          method: "email_password",
          error: authError.message,
        });
        return;
      }

      if (data.user?.id) {
        resetAnalytics();
        identify(data.user.id, { email });
      }
      track(
        "signup_completed",
        { method: "email_password" },
        { instant: true },
      );

      // Verification is off → signUp returns a session. Redirect to
      // welcome. If verification were still on, data.session would
      // be null and we'd need to show a "check your inbox" panel;
      // we've stopped supporting that path here.
      requestAnimationFrame(() => {
        window.location.assign("/dashboard/welcome");
      });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsEmailLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError(null);
    // No Turnstile on the Google path — Google already verifies who
    // this is, and the check was getting in the way of real signups.
    setIsGoogleLoading(true);
    track(
      "signup_started",
      { method: "google", source: "signup_page" },
      { instant: true },
    );

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent("/dashboard/welcome")}`,
        },
      });
      if (authError) {
        setError(authError.message);
        setIsGoogleLoading(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsGoogleLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">
          {isImportFlow
            ? "One more step — save your testimonial"
            : "Get your Wall of Love in 30 seconds"}
        </CardTitle>
        <CardDescription>
          {isImportFlow
            ? "The tweet you just imported is waiting. Sign up and we'll drop it on your wall."
            : "Free forever · No credit card · 10 testimonials on the free plan"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Email + password — primary form (visible first, focused
            first). Google fallback lives below the divider. */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@work.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isEmailLoading || isGoogleLoading}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isEmailLoading || isGoogleLoading}
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {/* Honeypot — random name so autofillers don't pattern-match.
              display:none (not off-screen positioning) is what
              actually keeps browser-native autofill / password
              managers out of it: an off-screen-but-rendered field
              still has a non-zero size and can get autofilled by
              Chrome/Safari along with the real email+password fields,
              which was silently rejecting real returning users as
              bots (see turnstile.tsx / login page for the matching
              fix). display:none is reliably skipped by autofill in
              every major browser, while a JS bot that blindly fills
              every <input> by selector still triggers it exactly as
              before. */}
          <input
            type="text"
            name="fx-check-2b7c"
            tabIndex={-1}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="other"
            value={botTrap}
            onChange={(e) => setBotTrap(e.target.value)}
            style={{ display: "none" }}
            aria-hidden="true"
          />

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isEmailLoading || isGoogleLoading || !email || !password}
          >
            {(isEmailLoading || verifyingTurnstile) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {verifyingTurnstile ? "Verifying…" : "Create my account"}
          </Button>
        </form>

        {/* Turnstile — blocks only on a real Cloudflare verify_failed
            verdict (see verifyTurnstile above). Mounted immediately on
            page load rather than gated on the user touching the email
            form, so it has the most possible lead time to produce a
            token in the background before anyone submits. Still
            invisible for Google-only visitors (interaction-only
            appearance). */}
        {turnstileConfigured && (
          <div className="mt-4 flex justify-center">
            <Turnstile
              onToken={(t) => {
                setTurnstileToken(t);
                const waiters = tokenWaitersRef.current;
                tokenWaitersRef.current = [];
                waiters.forEach((w) => w(t));
              }}
              onExpire={() => setTurnstileToken(null)}
              onUnavailable={(reason) => {
                track("turnstile_unavailable", { page: "signup", reason });
                const waiters = tokenWaitersRef.current;
                tokenWaitersRef.current = [];
                waiters.forEach((w) => w(null));
              }}
              resetSignal={turnstileResetKey}
              appearance="interaction-only"
              size="normal"
            />
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google — secondary path below the divider. */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full gap-2 border-2 hover:bg-slate-50"
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading || isEmailLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span className="font-semibold">Sign up with Google</span>
        </Button>
      </CardContent>
      <CardFooter>
        <p className="w-full text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
