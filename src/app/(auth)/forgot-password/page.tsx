"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
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
 * Forgot password — sends a Supabase password-recovery email that
 * routes users to /reset-password after they click the link.
 *
 * Low-volume path (~1-2/week) so it stays on Resend without any
 * meaningful quota impact.
 */

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email) return;
    setIsLoading(true);
    track("forgot_password_requested", { source: "forgot_page" });
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );
      if (authError) {
        setError(authError.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Couldn't send that link. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      {sent ? (
        <>
          <CardHeader className="space-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-center text-2xl">Check your inbox</CardTitle>
            <CardDescription className="text-center">
              We sent a password-reset link to{" "}
              <span className="font-medium text-foreground">{email}</span>. Click it
              to pick a new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">While you wait:</p>
              <ul className="mt-2 space-y-1.5 text-muted-foreground">
                <li>• Not in your inbox? Check spam / promotions</li>
                <li>• Link expires in 60 minutes</li>
                <li>
                  • Wrong email?{" "}
                  <button
                    onClick={() => {
                      setSent(false);
                      setError(null);
                    }}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Start over
                  </button>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Forgot your password?</CardTitle>
            <CardDescription>
              Enter your email and we&rsquo;ll send you a reset link.
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
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || !email}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              Remembered it?{" "}
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
