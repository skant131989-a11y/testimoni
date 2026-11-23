"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function OpenButton({ token, email }: { token: string; email: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/open/${token}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.next) {
        track("reminder_link_opened");
        window.location.href = data.next;
        return;
      }
      setError(
        data.error === "already_signed_in"
          ? "You are already signed in on another device. Log in to continue."
          : "That link didn't work. Get a new code instead."
      );
    } catch {
      setError("Network hiccup. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-6">
      <Button onClick={open} disabled={busy} size="lg" className="w-full">
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening…
          </>
        ) : (
          "Open my dashboard"
        )}
      </Button>
      {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Prefer a code?{" "}
        <Link href={`/login?email=${encodeURIComponent(email)}`} className="font-medium text-primary hover:underline">
          Send me a new code
        </Link>
      </p>
    </div>
  );
}
