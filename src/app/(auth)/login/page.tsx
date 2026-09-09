"use client";

import { useState } from "react";
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

/**
 * Bucket free-form Supabase auth error messages into a small set of
 * reasons so PostHog can group login failures without full-text
 * matching. Keep this list ordered — first match wins.
 */
function classifyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (!m) return "unknown";
  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) {
    return "invalid_credentials";
  }
  if (m.includes("email not confirmed") || m.includes("email link is invalid")) {
    return "email_not_confirmed";
  }
  if (m.includes("email rate limit") || m.includes("too many requests") || m.includes("rate limit")) {
    return "rate_limited";
  }
  if (m.includes("user not found") || m.includes("no user")) {
    return "user_not_found";
  }
  if (m.includes("network") || m.includes("fetch failed")) {
    return "network";
  }
  if (m.includes("locked")) {
    return "account_locked";
  }
  return "other";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  // Password mode is off by default — magic link is the primary
  // path. A "Prefer a password?" link reveals the password field
  // inline; the email field stays visible so users don't lose it.
  const [showPassword, setShowPassword] = useState(false);
  // Honeypot — bots fill every visible field, including hidden ones
  // named like "phone" or "website". Real humans never see or touch
  // it. If populated on submit, we silently reject without hitting
  // Supabase. Stops the noisiest bots without any user-facing friction.
  const [botTrap, setBotTrap] = useState("");
  // Timestamp of when the login form mounted. Bots submit within
  // milliseconds; humans take at least a couple of seconds to type.
  const [mountedAt] = useState(() => Date.now());

  const webmail = magicSent ? webmailForEmail(email) : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Bot check 1 — honeypot. Track the reject so we see in PostHog
    // when real users get caught by an autofilling password manager.
    if (botTrap) {
      track("login_rejected", { reason: "honeypot", method: "email" });
      setError("Login blocked. If your password manager filled a hidden field, refresh and try again.");
      return;
    }
    // Bot check 2 — submission < 800ms after mount.
    if (Date.now() - mountedAt < 800) {
      track("login_rejected", { reason: "too_fast", method: "email" });
      setError("Slow down a bit and try again.");
      return;
    }

    setIsLoading(true);
    track("login_started", { method: "email" }, { instant: true });

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError && !data.user) {
        setError(authError.message);
        const err = authError as unknown as {
          message?: string;
          status?: number;
          code?: string;
          name?: string;
        };
        track("login_failed", {
          method: "email",
          error: err.message ?? "unknown",
          error_status: err.status ?? null,
          error_code: err.code ?? null,
          error_name: err.name ?? null,
          reason: classifyAuthError(err.message ?? ""),
        });
        return;
      }

      if (data.user?.id) {
        resetAnalytics();
        identify(data.user.id, { email });
      }
      track("login_completed", { method: "email" }, { instant: true });
      window.location.assign("/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMagicLink(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    if (!email) return;
    setError(null);
    setIsMagicLoading(true);
    track("login_started", { method: "magic_link" }, { instant: true });
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent("/dashboard")}`,
        },
      });
      if (authError) {
        setError(authError.message);
        track("login_failed", {
          method: "magic_link",
          error: authError.message,
        });
        return;
      }
      setMagicSent(true);
      track("login_magic_link_sent", { email });
    } catch {
      setError("Couldn't send magic link. Try again.");
    } finally {
      setIsMagicLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setIsGoogleLoading(true);
    track("login_started", { method: "google" }, { instant: true });

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback`,
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
      {magicSent ? (
        <>
          <CardHeader className="space-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">Check your inbox</CardTitle>
            <CardDescription className="text-center">
              We sent a sign-in link to{" "}
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
                    surface: "login_magic",
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
                <li>&bull; Link expires in 1 hour — click it soon</li>
                <li>&bull; Not in your inbox? Check spam / promotions</li>
                <li>&bull; Wrong email? Refresh and try again</li>
              </ul>
            </div>
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
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              We&rsquo;ll email you a link — no password needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Magic-link form is the primary path on login too.
                Consistent shape with signup so muscle memory carries
                between the two pages. */}
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
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
                Also works if you forgot your password.
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
              onClick={handleGoogleLogin}
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

            {/* Password fallback — off by default. Reveals inline
                below so the email field stays visible; we don't
                make anyone re-enter it. */}
            {!showPassword ? (
              <button
                type="button"
                className="mt-6 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                onClick={() => {
                  setShowPassword(true);
                  track("login_password_mode_opened");
                }}
              >
                Prefer a password? →
              </button>
            ) : (
              <div className="mt-6 border-t pt-6">
                <p className="mb-3 text-sm font-medium text-foreground">
                  Sign in with password
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
                      autoComplete="current-password"
                    />
                  </div>

                  {/* Honeypot — random name so password managers
                      don't fill it. */}
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
                    Sign in with password
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
