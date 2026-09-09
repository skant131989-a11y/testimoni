"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track, identify, resetAnalytics } from "@/lib/analytics";
import { webmailForEmail } from "@/lib/email-provider";
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

export default function SignupPage() {
  const searchParams = useSearchParams();
  // The landing-page tweet preview redirects here with ?import=1 after
  // "Save to my Wall". Show a specific "your testimonial is waiting"
  // headline so the user knows exactly why they're here.
  const isImportFlow = searchParams.get("import") === "1";
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  // Password mode is off by default — the magic-link form is the
  // primary offering. A "Prefer a password?" link at the bottom
  // toggles this on; password fields render inline below the magic
  // link form so the user doesn't lose their email between modes.
  // ?password=1 in the URL auto-opens the panel — used by the
  // InlineSignup card's "Prefer a password? Sign up here" fallback
  // so those users land directly in the mode they want.
  const [showPassword, setShowPassword] = useState(
    () => searchParams.get("password") === "1"
  );
  // When email verification is enabled in Supabase Auth, signUp returns
  // a user but NO session. The user must click a link in their inbox
  // before they can log in. We flip verificationSent=true and render a
  // "check your inbox" panel instead of trying to redirect (which
  // would bounce off /dashboard auth-guard).
  const [verificationSent, setVerificationSent] = useState(false);
  // Honeypot + mount timestamp — same anti-bot pattern as the login
  // form. Silent reject; bots credential-stuff both endpoints.
  const [botTrap, setBotTrap] = useState("");
  const [mountedAt] = useState(() => Date.now());

  const webmail = magicSent || verificationSent ? webmailForEmail(email) : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // Silent bot rejects — but ALSO track them now so we can see in
    // PostHog when real users are getting caught. Password managers
    // (1Password, LastPass, Bitwarden, Chrome autofill) sometimes
    // populate any input named "website" — including our off-screen
    // honeypot — which used to silently drop real signups with no
    // trace. See name="fx-check-2b7c" on the honeypot below: random
    // string autofillers don't pattern-match on.
    if (botTrap) {
      track("signup_rejected", { reason: "honeypot", method: "email" });
      setError("Signup blocked. If your password manager filled a hidden field, refresh and try again.");
      return;
    }
    // 800ms window (was 1500ms) — still blocks scripted spam that
    // fires within one animation frame, doesn't punish real users
    // who paste a saved password and hit Enter fast.
    if (Date.now() - mountedAt < 800) {
      track("signup_rejected", { reason: "too_fast", method: "email" });
      setError("Slow down a bit and try again.");
      return;
    }

    setIsLoading(true);
    track("signup_started", { method: "email", source: "signup_page" }, { instant: true });

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent("/dashboard/welcome")}`,
        },
      });

      if (authError) {
        setError(authError.message);
        track("signup_failed", { method: "email", error: authError.message });
        return;
      }

      // Email verification path — Supabase returns a user but no
      // session when confirmation is required. Show the check-inbox
      // panel and STOP. The user clicks the emailed link, /callback
      // exchanges the code for a session, then routes to
      // /dashboard/welcome.
      if (data.user && !data.session) {
        track("signup_verification_sent", { method: "email" }, { instant: true });
        setVerificationSent(true);
        return;
      }

      // Verification off / user already confirmed — session is present.
      // Drop them straight into welcome.
      if (data.user?.id) {
        resetAnalytics();
        identify(data.user.id, { email });
      }
      track("signup_completed", { method: "email" }, { instant: true });
      requestAnimationFrame(() => {
        window.location.assign("/dashboard/welcome");
      });
      return;
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError(null);
    setIsGoogleLoading(true);
    track("signup_started", { method: "google", source: "signup_page" }, { instant: true });

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

  async function handleMagicLink(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    setError(null);
    if (!email) return;
    setIsMagicLoading(true);
    track("signup_started", { method: "magic_link", source: "signup_page" }, { instant: true });
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent("/dashboard/welcome")}`,
        },
      });
      if (authError) {
        setError(authError.message);
        track("signup_failed", { method: "magic_link", error: authError.message });
        return;
      }
      setMagicSent(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsMagicLoading(false);
    }
  }

  // Post-send state (magic link sent OR email-verification signup
  // pending). Both need the same UX: "check your inbox" + one-click
  // open-webmail button when we can detect the provider.
  const showInboxPanel = magicSent || verificationSent;
  const inboxTitle = verificationSent ? "Check your inbox" : "Magic link sent";
  const inboxSubtitle = verificationSent
    ? "We sent a confirmation link to"
    : "We sent a sign-in link to";

  return (
    <Card>
      {showInboxPanel ? (
        <>
          <CardHeader className="space-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">{inboxTitle}</CardTitle>
            <CardDescription className="text-center">
              {inboxSubtitle}{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click it and you&rsquo;re in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {webmail && (
              <a
                href={webmail.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("auth_open_webmail_clicked", {
                    provider: webmail.name,
                    surface: verificationSent ? "signup_verification" : "signup_magic",
                  })
                }
              >
                <Button className="w-full" type="button">
                  Open {webmail.name}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">While you wait:</p>
              <ul className="mt-2 space-y-1.5 text-muted-foreground">
                <li>&bull; Link expires in 24 hours — click it soon</li>
                <li>&bull; Not in your inbox? Check spam / promotions</li>
                <li>&bull; Wrong email? Refresh and try again</li>
              </ul>
            </div>
            {verificationSent && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    const supabase = createClient();
                    const { error: resendError } = await supabase.auth.signUp({
                      email,
                      password,
                      options: {
                        emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent("/dashboard/welcome")}`,
                      },
                    });
                    if (resendError) {
                      setError(resendError.message);
                      return;
                    }
                    track("signup_verification_resent", { method: "email" });
                  } catch {
                    setError("Couldn't resend. Try again in a moment.");
                  }
                }}
              >
                Resend confirmation email
              </Button>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              Wrong email?{" "}
              <button
                type="button"
                onClick={() => {
                  setVerificationSent(false);
                  setMagicSent(false);
                  setError(null);
                }}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Start over
              </button>
            </p>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">
              {isImportFlow
                ? "One more step — save your testimonial"
                : "Get your Wall of Love in 30 seconds"}
            </CardTitle>
            <CardDescription>
              {isImportFlow
                ? "The tweet you just imported is waiting in your workspace. Sign up and we'll drop it on your Wall of Love."
                : "Free forever · No password to remember"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Magic-link form is the primary path. One field, one
                button — the fastest signup we can offer. */}
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@work.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isMagicLoading || isLoading}
                  autoComplete="email"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isMagicLoading || !email}
              >
                {isMagicLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send me a sign-in link
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                We&rsquo;ll email you a one-click link — no password needed.
              </p>
              {error && !showPassword && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </form>

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

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              Google
            </Button>

            {/* Password fallback — hidden behind a toggle. Password
                users can still sign up in the classic way, but we
                don't lead with it. Reveals inline so the email
                field stays in view. */}
            {!showPassword ? (
              <button
                type="button"
                className="mt-6 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                onClick={() => {
                  setShowPassword(true);
                  track("signup_password_mode_opened");
                }}
              >
                Prefer a password? →
              </button>
            ) : (
              <div className="mt-6 border-t pt-6">
                <p className="mb-3 text-sm font-medium text-foreground">
                  Sign up with password
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  {/* Honeypot — bots fill any input; humans never see
                      it. Random name so password managers don't
                      pattern-match. */}
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create account with password
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
