"use client";

import { useState } from "react";
import { Bell, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";

/**
 * Shown on an empty Find my praise / Customer Voice result: leave an email
 * and we check the site again over the next weeks and write once if more
 * turns up. The address is sent to /api/watch only; it is never put in an
 * analytics event.
 */
export function NotifyMeBox({
  tool,
  url,
  scanId,
}: {
  tool: "find-proof" | "customer-voice";
  url?: string;
  scanId?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), tool, url, scanId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setState("error");
        return;
      }
      setState("done");
      track("watch_requested", { tool });
    } catch {
      setError("Network hiccup. Try again in a moment.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="mx-auto mt-6 flex max-w-md items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-left text-sm text-emerald-900">
        <Check className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Done. We&rsquo;ll check again over the next few weeks and email you once if we find something.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-6 max-w-md rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-left">
      <p className="flex items-center gap-2 font-semibold">
        <Bell className="h-4 w-4 text-primary" /> Nothing yet? We&rsquo;ll keep looking.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Leave your email and we&rsquo;ll check again over the next few weeks. You get one email, only if we find something.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "sending"}
          className="flex-1 bg-background"
        />
        <Button type="submit" disabled={state === "sending" || !email.trim()} className="gap-2">
          {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
          Email me
        </Button>
      </div>
      {state === "error" && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </form>
  );
}
