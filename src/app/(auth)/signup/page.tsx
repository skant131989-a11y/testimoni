"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track, identify, resetAnalytics } from "@/lib/analytics";
import { isGmailDotStuffing } from "@/lib/bot-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTurnstileGate } from "@/components/auth/use-turnstile-gate";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
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
 * Email verification is ON (Supabase Auth → Providers → Email → "Confirm
 * email"). signUp returns no session; we show the "Check your email"
 * screen and the user enters the emailed code to activate the account.
 * That proves they own the address — bots were creating accounts with
 * other people's real emails (and triggering our welcome email to them).
 *
 * ── Anti-bot ─────────────────────────────────────────────────────
 * Turnstile now FAILS CLOSED (see use-turnstile-gate.tsx): no token, a
 * bad verdict or an unreachable verifier all stop the signup. Gmail
 * dot-stuffing (bot-email.ts) is also a hard block. Honeypot and the
 * mount-timestamp check remain telemetry only.
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
  const gate = useTurnstileGate("signup");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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
    // Gmail dot-stuffing — a real, near-zero-false-positive bot
    // signal (see bot-email.ts), so unlike honeypot/too_fast above
    // this one actually blocks.
    if (isGmailDotStuffing(email)) {
      track("signup_rejected", { reason: "gmail_dot_pattern", method: "email", enforced: true });
      setError("Please sign up with your regular email address.");
      return;
    }
    const check = await gate.verify("signup_email");
    if (!check.ok) {
      setError(check.message);
      return;
    }

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
        options: check.captchaToken ? { captchaToken: check.captchaToken } : undefined,
      });
      if (check.captchaToken) gate.reset();

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

      // Confirm-email is ON: no session yet. (If Supabase returns a user
      // with no identities, that address is already registered — it
      // hides that from bots by returning a fake user.)
      if (!data.session) {
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError("That email is already registered. Try signing in instead.");
          track("signup_failed", { method: "email_password", error: "already_registered" });
          return;
        }
        track("signup_verification_shown", { method: "email_password" });
        setPendingEmail(email);
        return;
      }

      // Confirm-email is OFF (e.g. local dev): signed in immediately.
      if (data.user?.id) {
        resetAnalytics();
        identify(data.user.id, { email });
      }
      track("signup_completed", { method: "email_password" }, { instant: true });
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

  async function resendSignupCode(): Promise<{ error?: string }> {
    const check = await gate.verify("signup_resend");
    if (!check.ok) return { error: check.message };
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail ?? email,
        options: check.captchaToken ? { captchaToken: check.captchaToken } : undefined,
      });
      if (check.captchaToken) gate.reset();
      return authError ? { error: authError.message } : {};
    } catch {
      return { error: "Couldn't resend the code. Please try again." };
    }
  }

  if (pendingEmail) {
    return (
      <Card>
        <CardContent className="pt-6">
          <VerifyEmailScreen
            email={pendingEmail}
            mode="signup"
            redirectTo="/dashboard/welcome"
            surface="signup"
            onResend={resendSignupCode}
            onChangeEmail={() => {
              setPendingEmail(null);
              setPassword("");
            }}
          />
          {gate.widget}
        </CardContent>
      </Card>
    );
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
            {(isEmailLoading || gate.verifying) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {gate.verifying ? "Verifying…" : "Create my account"}
          </Button>
        </form>

        {gate.widget}

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
