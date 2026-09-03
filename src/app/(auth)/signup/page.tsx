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
  // Honeypot + mount timestamp — same anti-bot pattern as the login
  // form. Silent reject; bots credential-stuff both endpoints.
  const [botTrap, setBotTrap] = useState("");
  const [mountedAt] = useState(() => Date.now());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (botTrap) return;
    if (Date.now() - mountedAt < 1500) return;

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

      // With email confirmation off in Supabase, signUp returns a
      // session immediately — drop the user straight into welcome.
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

  async function handleMagicLink() {
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
            ? "The tweet you just imported is waiting in your workspace. Sign up and we'll drop it on your Wall of Love."
            : "Free forever · No credit card"}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
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

          {/* Honeypot field — bots fill it, humans never see it. */}
          <input
            type="text"
            name="website"
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
            Create account
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Free forever · No credit card
          </p>
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

        {/* Magic link — passwordless alternative. Same slot as on
            /login so users flipping between the two pages see the
            same layout in the same order. */}
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full"
          onClick={handleMagicLink}
          disabled={isMagicLoading || !email}
        >
          {isMagicLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : magicSent ? (
            <>✓ Link sent to {email} — check your inbox</>
          ) : (
            <>Email me a sign-in link {email ? "" : "(enter email above)"}</>
          )}
        </Button>
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
    </Card>
  );
}
