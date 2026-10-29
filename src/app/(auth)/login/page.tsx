"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track, identify, resetAnalytics } from "@/lib/analytics";
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
 * Login page — reworked 2026-09.
 *
 * Google is the primary path. Email + password is secondary but always
 * visible. Magic link was removed — it depended on Resend/email delivery,
 * which killed conversion during the bot-driven email quota exhaustion.
 *
 * Callback error handling (?error=... from /callback) still routes users
 * to a friendly message + the fallback methods.
 */

function classifyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (!m) return "unknown";
  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid email or password")
  )
    return "invalid_credentials";
  if (m.includes("email not confirmed")) return "email_not_confirmed";
  if (
    m.includes("email rate limit") ||
    m.includes("too many requests") ||
    m.includes("rate limit")
  )
    return "rate_limited";
  if (m.includes("user not found") || m.includes("no user")) return "user_not_found";
  if (m.includes("network") || m.includes("fetch failed")) return "network";
  if (m.includes("locked")) return "account_locked";
  return "other";
}

function callbackErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "expired":
    case "otp_expired":
      return "That sign-in link expired (they last ~1 hour). Sign in with Google below, or hit \"Forgot password\" to get a fresh link.";
    case "already_used":
      return "That sign-in link was already used. Sign in below with Google or your password to continue.";
    case "pkce_mismatch":
      return "Something interrupted your sign-in — usually Safari's cookie blocking, a private-browsing tab, or opening in a different browser than you started in. Try Google again in a fresh tab, or use email + password below (that always works).";
    case "no_code":
      return "That URL is missing sign-in info. Sign in below to start over.";
    case "access_denied":
      return "Sign-in was cancelled. Try again below.";
    case "provider_hiccup":
      return "Google hiccupped on the first try — this is a known Google quirk. Click \"Continue with Google\" again below; it almost always works on the second attempt.";
    case "auth_callback_error":
    case "unknown":
      return "We couldn't complete sign-in. Sign in with password or Google below.";
    default:
      return null;
  }
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [botTrap, setBotTrap] = useState("");
  const [mountedAt] = useState(() => Date.now());
  // ── Anti-bot ──────────────────────────────────────────────────────
  // Turnstile now FAILS CLOSED (use-turnstile-gate.tsx). Password login
  // still gets FREE_FAILED_ATTEMPTS free passes — nobody solves a check
  // on a normal first try; repeated wrong passwords look like credential
  // stuffing, so the gate engages after that. Requesting an emailed code
  // always needs the gate (it sends an email, so it can be abused).
  // When Supabase's own CAPTCHA is on (NEXT_PUBLIC_SUPABASE_CAPTCHA=1)
  // every auth call needs a token, so the gate is always engaged.
  const gate = useTurnstileGate("login");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const FREE_FAILED_ATTEMPTS = 2;
  const alwaysGate = process.env.NEXT_PUBLIC_SUPABASE_CAPTCHA === "1";
  const [useCode, setUseCode] = useState(false);
  const [pending, setPending] = useState<{ email: string; mode: "login" | "signup" } | null>(null);

  const nextParam = searchParams.get("next");
  const nextPath = nextParam?.startsWith("/") ? nextParam : "/dashboard";

  // Some auth callback errors arrive as fragment (?…#error=…) since
  // Supabase pushes to a hash on the OAuth return. Read both.
  const [hashErrorCode, setHashErrorCode] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash;
    if (!raw) return;
    const params = new URLSearchParams(raw.slice(1));
    setHashErrorCode(params.get("error_code") || params.get("error"));
  }, []);
  const callbackErrorCode = searchParams.get("error") || hashErrorCode;
  const callbackMsg = callbackErrorMessage(callbackErrorCode);

  useEffect(() => {
    if (callbackErrorCode) {
      track("login_callback_error_shown", {
        reason: callbackErrorCode,
        source: hashErrorCode ? "hash" : "query",
      });
    }
  }, [callbackErrorCode, hashErrorCode]);

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (botTrap) {
      // Logged, not blocked — see the anti-bot note above. Clear it
      // so a one-off autofill doesn't keep tripping for the rest of
      // this visit.
      track("login_rejected", { reason: "honeypot", method: "email", enforced: false });
      setBotTrap("");
    }
    if (Date.now() - mountedAt < 800) {
      track("login_rejected", { reason: "too_fast", method: "email", enforced: false });
    }
    // Skip the check entirely for the first couple of attempts — see
    // the note above. Only blocks (once engaged) on a real Cloudflare
    // "verify_failed" verdict.
    let captchaToken: string | undefined;
    if (alwaysGate || failedAttempts >= FREE_FAILED_ATTEMPTS) {
      const check = await gate.verify("login_email");
      if (!check.ok) {
        setError(check.message);
        return;
      }
      captchaToken = check.captchaToken;
    }

    setIsLoading(true);
    track("login_started", { method: "email_password" }, { instant: true });

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      if (captchaToken) gate.reset();

      if (authError && !data.user) {
        const reason = classifyAuthError(authError.message);
        if (reason === "email_not_confirmed") {
          // Account exists but the address was never verified: send a
          // fresh confirmation code and show the verify screen.
          const sent = await sendConfirmationCode(email);
          if (sent.ok) {
            track("login_unconfirmed_code_sent", {});
            setPending({ email, mode: "signup" });
          } else {
            setError(sent.message);
          }
          return;
        }
        setError(
          reason === "invalid_credentials"
            ? "Wrong email or password. Try again, or email yourself a sign-in code below."
            : authError.message,
        );
        track("login_failed", {
          method: "email_password",
          reason,
          error: authError.message,
        });
        setFailedAttempts((n) => n + 1);
        return;
      }

      if (data.user?.id) {
        resetAnalytics();
        identify(data.user.id, { email });
      }
      track("login_completed", { method: "email_password" }, { instant: true });
      requestAnimationFrame(() => {
        window.location.assign(nextPath);
      });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendConfirmationCode(addr: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const check = await gate.verify("login_confirm_resend");
    if (!check.ok) return { ok: false, message: check.message };
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resend({
        type: "signup",
        email: addr,
        options: check.captchaToken ? { captchaToken: check.captchaToken } : undefined,
      });
      if (check.captchaToken) gate.reset();
      if (authError) return { ok: false, message: authError.message };
      return { ok: true };
    } catch {
      return { ok: false, message: "Couldn't send the code. Please try again." };
    }
  }

  async function requestLoginCode(addr: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const check = await gate.verify("login_code");
    if (!check.ok) return { ok: false, message: check.message };
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: addr,
        options: {
          // Login only — never creates an account (signups go through
          // /signup with its own checks).
          shouldCreateUser: false,
          ...(check.captchaToken ? { captchaToken: check.captchaToken } : {}),
        },
      });
      if (check.captchaToken) gate.reset();
      if (authError) {
        const reason = classifyAuthError(authError.message);
        // "No account for that email" must look the same as success, or
        // this form lets anyone probe which emails are registered.
        if (reason === "rate_limited" || reason === "network") {
          return { ok: false, message: authError.message };
        }
      }
      return { ok: true };
    } catch {
      return { ok: false, message: "Couldn't send the code. Please try again." };
    }
  }

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email) return;
    setIsLoading(true);
    track("login_started", { method: "email_code" }, { instant: true });
    const sent = await requestLoginCode(email);
    setIsLoading(false);
    if (!sent.ok) {
      setError(sent.message);
      track("login_failed", { method: "email_code", error: sent.message });
      return;
    }
    track("login_code_requested", {});
    setPending({ email, mode: "login" });
  }

  async function handleGoogleLogin() {
    setError(null);
    // No Turnstile here: Google already verifies who this is, and
    // logging in to an existing account can't farm signups.
    setIsGoogleLoading(true);
    track("login_started", { method: "google" }, { instant: true });

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(nextPath)}`,
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

  if (pending) {
    return (
      <Card>
        <CardContent className="pt-6">
          <VerifyEmailScreen
            email={pending.email}
            mode={pending.mode}
            redirectTo={pending.mode === "signup" ? "/dashboard/welcome" : nextPath}
            surface="login"
            onResend={async () => {
              const r = pending.mode === "signup" ? await sendConfirmationCode(pending.email) : await requestLoginCode(pending.email);
              return r.ok ? {} : { error: r.message };
            }}
            onChangeEmail={() => {
              setPending(null);
              setError(null);
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
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Wall of Love</CardDescription>
      </CardHeader>
      <CardContent>
        {callbackMsg && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
              callbackErrorCode === "provider_hiccup" ||
              callbackErrorCode === "pkce_mismatch"
                ? "border-violet-300 bg-violet-50 text-violet-900"
                : "border-amber-300 bg-amber-50 text-amber-900"
            }`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p>{callbackMsg}</p>
              {(callbackErrorCode === "provider_hiccup" ||
                callbackErrorCode === "pkce_mismatch" ||
                callbackErrorCode === "expired" ||
                callbackErrorCode === "otp_expired" ||
                callbackErrorCode === "already_used") && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(callbackErrorCode === "provider_hiccup" ||
                    callbackErrorCode === "pkce_mismatch") && (
                    <button
                      type="button"
                      onClick={() => {
                        // Strip the ?error= param from the URL so the
                        // stale error state doesn't stick in browser
                        // history if the user hesitates and reloads.
                        try {
                          window.history.replaceState(null, "", "/login");
                        } catch {}
                        handleGoogleLogin();
                      }}
                      disabled={isGoogleLoading || isLoading}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-300 transition-all hover:-translate-y-0.5 hover:shadow"
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          Try Google again
                        </>
                      )}
                    </button>
                  )}
                  {(callbackErrorCode === "expired" ||
                    callbackErrorCode === "otp_expired" ||
                    callbackErrorCode === "already_used") && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            window.history.replaceState(null, "", "/login");
                          } catch {}
                          handleGoogleLogin();
                        }}
                        disabled={isGoogleLoading || isLoading}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-300 transition-all hover:-translate-y-0.5 hover:shadow"
                      >
                        {isGoogleLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Sign in with Google
                          </>
                        )}
                      </button>
                      <Link
                        href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow"
                      >
                        Send me a fresh link
                      </Link>
                    </>
                  )}
                  {callbackErrorCode === "pkce_mismatch" && (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          window.history.replaceState(null, "", "/login");
                        } catch {}
                        document
                          .getElementById("email")
                          ?.focus({ preventScroll: false });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow"
                    >
                      Or use email + password ↓
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email + password — primary form (visible first). Google
            fallback lives below the divider. */}
        <form onSubmit={useCode ? handleSendCode : handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@work.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || isGoogleLoading}
              autoComplete="email"
            />
          </div>
          {!useCode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || isGoogleLoading}
              autoComplete="current-password"
            />
          </div>
          )}

          {/* Honeypot — display:none (not off-screen positioning) is
              what actually keeps browser-native autofill / password
              managers out of it: an off-screen-but-rendered field
              still has a non-zero size and can get autofilled by
              Chrome/Safari along with the real email+password fields
              for a returning user, which was silently rejecting real
              logins as bots. display:none is reliably skipped by
              autofill in every major browser, while a JS bot that
              blindly fills every <input> by selector still triggers
              it exactly as before. */}
          <input
            type="text"
            name="fx-check-9a2f"
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
            disabled={isLoading || isGoogleLoading || !email || (!useCode && !password)}
          >
            {(isLoading || gate.verifying) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {gate.verifying ? "Verifying…" : useCode ? "Email me a code" : "Sign in"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setUseCode((v) => !v);
              setError(null);
            }}
            className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {useCode ? "Use my password instead" : "Email me a sign-in code instead"}
          </button>
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

        {/* Google — secondary path */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full gap-2 border-2 hover:bg-slate-50"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
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
          <span className="font-semibold">Sign in with Google</span>
        </Button>
      </CardContent>
      <CardFooter>
        <p className="w-full text-center text-sm text-muted-foreground">
          New to Testimoni?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create a free account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
