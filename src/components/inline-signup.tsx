"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track, identify } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InlineSignupProps {
  /** Tracked as ?src=... on the /dashboard/welcome landing so we know
   *  which surface converted the user. */
  source: string;
  /** Optional prefix for form field ids so multiple instances on one
   *  page don't collide. */
  idPrefix?: string;
}

export function InlineSignup({ source, idPrefix = "inline" }: InlineSignupProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Email-verification state — when Supabase's Confirm Email is on,
  // signUp() returns a user but no session. We swap the form for an
  // inline "check your inbox" panel instead of trying to redirect
  // (which would bounce off /dashboard's auth guard).
  const [verificationSent, setVerificationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email || password.length < 8) {
      setError("Enter an email and a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    track("signup_started", { method: "email", source }, { instant: true });
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(`/dashboard/welcome?src=${source}`)}`,
        },
      });
      if (authError) {
        setError(authError.message);
        track("signup_failed", { method: "email", source, error: authError.message });
        return;
      }
      // Verification-required path — signUp returns user + null
      // session. Show inline confirmation state and STOP. Do not
      // identify() (no session to attribute to) and do not redirect.
      if (data.user && !data.session) {
        track("signup_verification_sent", { method: "email", source }, { instant: true });
        setVerificationSent(true);
        return;
      }
      if (data.user?.id) identify(data.user.id, { email });
      track("signup_completed", { method: "email", source }, { instant: true });
      window.location.assign(`/dashboard/welcome?src=${source}`);
    } catch {
      setError("Something went wrong. Try again or use the signup page.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    track("signup_started", { method: "google", source }, { instant: true });
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(`/dashboard/welcome?src=${source}`)}`,
        },
      });
      if (authError) {
        setError(authError.message);
        track("signup_failed", { method: "google", source, error: authError.message });
        setGoogleLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again or use the signup page.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      {verificationSent ? (
        // Compact check-inbox state — the InlineSignup lives on
        // marketing pages (home, pricing, features, demo, wall,
        // /for/[niche]) so it stays tight, not full-page.
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="text-lg">📬</span>
          </div>
          <div>
            <h3 className="text-base font-semibold">Check your inbox</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click it and you&rsquo;re in.
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Link expires in 24 hours · Not in your inbox? Check
            spam / promotions
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                setError(null);
                try {
                  const supabase = createClient();
                  const { error: resendError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                      emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(`/dashboard/welcome?src=${source}`)}`,
                    },
                  });
                  if (resendError) {
                    setError(resendError.message);
                    return;
                  }
                  track("signup_verification_resent", { method: "email", source });
                } catch {
                  setError("Couldn't resend. Try again in a moment.");
                }
              }}
              className="w-full"
            >
              Resend confirmation
            </Button>
            <button
              type="button"
              onClick={() => {
                setVerificationSent(false);
                setError(null);
              }}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              Wrong email? Start over
            </button>
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor={`${idPrefix}-email`} className="text-xs">
            Email
          </Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || googleLoading}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-password`} className="text-xs">
            Password
          </Label>
          <Input
            id={`${idPrefix}-password`}
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || googleLoading}
            className="mt-1"
          />
        </div>

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
            </>
          ) : (
            <>
              Create free account <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={loading || googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continue with Google
      </Button>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
        </>
      )}
    </div>
  );
}
