"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
 * Reset password — lands here after the user clicks the recovery link
 * in their inbox. Supabase auto-establishes a temporary session on
 * that click; we call auth.updateUser({ password }) to set the new one
 * and then bounce to /dashboard.
 */

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) {
        setError(authError.message);
        track("reset_password_failed", { error: authError.message });
        return;
      }
      setDone(true);
      track("reset_password_completed");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setError("Couldn't update your password. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      {done ? (
        <CardHeader className="space-y-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-center text-2xl">Password updated</CardTitle>
          <CardDescription className="text-center">
            Redirecting you to your dashboard…
          </CardDescription>
        </CardHeader>
      ) : (
        <>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Pick a new password</CardTitle>
            <CardDescription>
              At least 8 characters. Once you save, you&rsquo;ll be signed in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !password || !confirm}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save new password
              </Button>
            </form>
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
      )}
    </Card>
  );
}
