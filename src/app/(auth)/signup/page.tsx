"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track, identify, resetAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
 * We keep the honeypot + mount-timestamp check that was already in
 * place. Turnstile is the next layer to add — hooks are in place
 * for it (see the commented Turnstile block below).
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

  async function handleEmailSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (botTrap) {
      track("signup_rejected", { reason: "honeypot", method: "email" });
      setError(
        "Signup blocked. If your password manager filled a hidden field, refresh and try again.",
      );
      return;
    }
    if (Date.now() - mountedAt < 800) {
      track("signup_rejected", { reason: "too_fast", method: "email" });
      setError("Slow down a bit and try again.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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

          {/* Honeypot — random name so autofillers don't pattern-match */}
          <input
            type="text"
            name="fx-check-2b7c"
            tabIndex={-1}
            autoComplete="off"
            value={botTrap}
            onChange={(e) => setBotTrap(e.target.value)}
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
              opacity: 0,
              pointerEvents: "none",
            }}
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
            {isEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create my account
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            No email verification. You&rsquo;re in the moment you click.
          </p>
        </form>

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
