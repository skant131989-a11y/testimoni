"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track, identify, resetAnalytics } from "@/lib/analytics";
import { isGmailDotStuffing } from "@/lib/bot-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTurnstileGate } from "@/components/auth/use-turnstile-gate";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

/**
 * One form for /login and /signup.
 *
 * Why: a visitor who typed an email on /login and asked for a code was
 * told "We couldn't find an account" (login never created accounts), and
 * one who typed a password on /signup then tried /login failed the same
 * way. Now entering an email sends a 6-digit code that logs an existing
 * account in or creates a new one in the same step; Google does the same;
 * a password stays available for people who already have one.
 *
 * Anti-bot is unchanged: the Turnstile gate is required before a code is
 * sent (it sends an email, so it can be abused), Gmail dot-stuffing is
 * blocked, and Google needs no gate because Google verifies the person.
 *
 * `variant` only changes the heading copy and the analytics event names
 * (signup_* vs login_*) so existing funnels keep working.
 */

function classifyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (!m) return "unknown";
  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) return "invalid_credentials";
  if (m.includes("email not confirmed")) return "email_not_confirmed";
  if (m.includes("email rate limit") || m.includes("too many requests") || m.includes("rate limit")) return "rate_limited";
  if (m.includes("network") || m.includes("fetch failed")) return "network";
  if (m.includes("locked")) return "account_locked";
  return "other";
}

function callbackErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "expired":
    case "otp_expired":
      return "That sign-in link expired (they last about an hour). Continue with Google or get a fresh code below.";
    case "already_used":
      return "That sign-in link was already used. Continue below to sign in.";
    case "pkce_mismatch":
      return "Something interrupted your sign-in. This is usually Safari's cookie blocking, a private-browsing tab, or opening the link in a different browser than you started in. Try Google again in a fresh tab, or use an emailed code below.";
    case "no_code":
      return "That URL is missing sign-in info. Continue below to start over.";
    case "access_denied":
      return "Sign-in was cancelled. Try again below.";
    case "provider_hiccup":
      return "Google hiccupped on the first try. This is a known Google quirk. Click \"Continue with Google\" again; it almost always works on the second attempt.";
    case "auth_callback_error":
    case "unknown":
      return "We couldn't complete sign-in. Try Google or an emailed code below.";
    default:
      return null;
  }
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function AuthForm({ variant }: { variant: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const isImportFlow = variant === "signup" && searchParams.get("import") === "1";
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [botTrap, setBotTrap] = useState("");
  const [mountedAt] = useState(() => Date.now());
  // Password sign-in gets a couple of free tries before the Turnstile
  // check engages (repeated wrong passwords look like credential
  // stuffing). Sending a code always needs it.
  const gate = useTurnstileGate(variant);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const FREE_FAILED_ATTEMPTS = 2;
  const alwaysGate = process.env.NEXT_PUBLIC_SUPABASE_CAPTCHA === "1";
  const [pending, setPending] = useState<{ email: string; mode: "login" | "signup" } | null>(null);

  const nextParam = searchParams.get("next");
  const nextPath = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  // Some auth callback errors arrive as a fragment (?…#error=…).
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
      track("login_callback_error_shown", { reason: callbackErrorCode, source: hashErrorCode ? "hash" : "query" });
    }
  }, [callbackErrorCode, hashErrorCode]);

  function noteBotSignals(kind: "login" | "signup", method: string) {
    if (botTrap) {
      // Logged, not blocked (a one-off autofill must not stop a real person).
      track(`${kind}_rejected`, { reason: "honeypot", method, enforced: false });
      setBotTrap("");
    }
    if (Date.now() - mountedAt < 800) {
      track(`${kind}_rejected`, { reason: "too_fast", method, enforced: false });
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

  /** Sends a code that logs an existing account in or creates a new one. */
  async function requestCode(addr: string): Promise<{ ok: true } | { ok: false; message: string }> {
    if (isGmailDotStuffing(addr)) {
      track(`${variant}_rejected`, { reason: "gmail_dot_pattern", method: "email_code", enforced: true });
      return { ok: false, message: "Please use your regular email address, or continue with Google." };
    }
    const check = await gate.verify("login_code");
    if (!check.ok) return { ok: false, message: check.message };
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: addr,
        options: {
          shouldCreateUser: true,
          ...(check.captchaToken ? { captchaToken: check.captchaToken } : {}),
        },
      });
      if (check.captchaToken) gate.reset();
      if (authError) {
        const reason = classifyAuthError(authError.message);
        if (reason === "rate_limited") {
          return { ok: false, message: "Too many code requests. Please wait a minute and try again." };
        }
        return { ok: false, message: authError.message };
      }
      return { ok: true };
    } catch {
      return { ok: false, message: "Couldn't send the code. Please try again." };
    }
  }

  async function continueWithEmail() {
    setError(null);
    noteBotSignals(variant, "email_code");
    setIsLoading(true);
    track(variant === "signup" ? "signup_started" : "login_started", { method: "email_code", source: `${variant}_page` }, { instant: true });
    const sent = await requestCode(email.trim());
    setIsLoading(false);
    if (!sent.ok) {
      setError(sent.message);
      track(variant === "signup" ? "signup_failed" : "login_failed", { method: "email_code", error: sent.message });
      return;
    }
    track("login_code_requested", { variant });
    setPending({ email: email.trim(), mode: "login" });
  }

  async function signInWithPassword() {
    setError(null);
    noteBotSignals("login", "email");
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
            ? "Wrong email or password. No account yet? Use \"Email me a code instead\" below and we'll create one."
            : authError.message
        );
        track("login_failed", { method: "email_password", reason, error: authError.message });
        setFailedAttempts((n) => n + 1);
        return;
      }

      if (data.user?.id) {
        resetAnalytics();
        identify(data.user.id);
      }
      track("login_completed", { method: "email_password" }, { instant: true });
      requestAnimationFrame(() => window.location.assign(nextPath));
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (usePassword) void signInWithPassword();
    else void continueWithEmail();
  }

  async function handleGoogle() {
    setError(null);
    // No Turnstile here: Google already verifies who this is.
    setIsGoogleLoading(true);
    track(variant === "signup" ? "signup_started" : "login_started", { method: "google", source: `${variant}_page` }, { instant: true });
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(nextPath)}` },
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

  function retryGoogleFromBanner() {
    try {
      window.history.replaceState(null, "", variant === "signup" ? "/signup" : "/login");
    } catch {}
    void handleGoogle();
  }

  if (pending) {
    return (
      <Card>
        <CardContent className="pt-6">
          <VerifyEmailScreen
            email={pending.email}
            mode={pending.mode}
            // The code logs in or creates the account; /auth/continue sends
            // brand-new accounts to the welcome flow and everyone else on.
            redirectTo={pending.mode === "signup" ? "/dashboard/welcome" : `/auth/continue?next=${encodeURIComponent(nextPath)}`}
            successEvent={pending.mode === "login" && variant === "signup" ? "signup_completed" : undefined}
            surface={variant}
            onResend={async () => {
              const r = pending.mode === "signup" ? await sendConfirmationCode(pending.email) : await requestCode(pending.email);
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

  const busy = isLoading || isGoogleLoading;
  const title =
    variant === "signup"
      ? isImportFlow
        ? "One more step: save your testimonial"
        : "Get your Wall of Love in 30 seconds"
      : "Welcome back";
  const subtitle =
    variant === "signup"
      ? isImportFlow
        ? "The tweet you just imported is waiting. Continue and we'll drop it on your wall."
        : "Free forever · No credit card · 15 testimonials on the free plan"
      : "Log in to your Wall of Love, or create your account in the same step";

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {callbackMsg && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
              callbackErrorCode === "provider_hiccup" || callbackErrorCode === "pkce_mismatch"
                ? "border-violet-300 bg-violet-50 text-violet-900"
                : "border-amber-300 bg-amber-50 text-amber-900"
            }`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p>{callbackMsg}</p>
              {["provider_hiccup", "pkce_mismatch", "expired", "otp_expired", "already_used"].includes(callbackErrorCode ?? "") && (
                <button
                  type="button"
                  onClick={retryGoogleFromBanner}
                  disabled={busy}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-300 transition-all hover:-translate-y-0.5 hover:shadow"
                >
                  {isGoogleLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <GoogleIcon className="h-3.5 w-3.5" />}
                  Try Google again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Google first: one click, works for new and returning people. */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full gap-2 border-2 hover:bg-slate-50"
          onClick={handleGoogle}
          disabled={busy}
        >
          {isGoogleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
          <span className="font-semibold">Continue with Google</span>
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or use your email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@work.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
              autoComplete="email"
            />
          </div>

          {usePassword && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={busy}
                autoComplete="current-password"
              />
            </div>
          )}

          {/* Honeypot: display:none keeps browser autofill out of it, while a
              bot that fills every <input> still trips it. */}
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

          <Button type="submit" className="w-full" size="lg" disabled={busy || !email || (usePassword && !password)}>
            {(isLoading || gate.verifying) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {gate.verifying ? "Verifying…" : usePassword ? "Sign in" : "Continue with email"}
          </Button>

          {!usePassword && (
            <p className="text-center text-xs text-muted-foreground">
              We&apos;ll email you a 6-digit code. New here? That creates your account, no password needed.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setUsePassword((v) => !v);
              setError(null);
            }}
            disabled={busy}
            className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-60"
          >
            {usePassword ? "Email me a code instead" : "I have a password"}
          </button>
        </form>

        {gate.widget}
      </CardContent>
    </Card>
  );
}
