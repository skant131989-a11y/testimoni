"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Sparkles, Clock } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { UpgradeProButton } from "@/components/upgrade-pro-button";
import { track } from "@/lib/analytics";

/**
 * Starts the 14-day Pro trial (no card) and refreshes the page so every
 * Pro feature shows up. Used by the dashboard banner and the proof
 * placement page.
 */
export function StartTrialButton({
  surface,
  label = "Start 14-day Pro trial",
  size,
  variant,
}: {
  surface: string;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    track("trial_start_clicked", { surface });
    try {
      const res = await fetch("/api/trial/start", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Couldn't start the trial. Try again.");
        setBusy(false);
        return;
      }
      track("trial_started", { surface });
      router.refresh();
    } catch {
      setError("Network hiccup. Try again in a moment.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button onClick={start} disabled={busy} size={size} variant={variant} className="gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Dashboard banner: offers the trial, or shows how many trial days are left. */
export function TrialBanner({ state, daysLeft }: { state: "eligible" | "active"; daysLeft?: number }) {
  useEffect(() => {
    track("trial_banner_viewed", { state, days_left: daysLeft });
  }, [state, daysLeft]);

  if (state === "eligible") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <p className="font-semibold">Try Pro free for 14 days. No card.</p>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Proof placement: see which pages of your site have no proof, and which quotes belong on each</li>
            <li>• Unlimited testimonials and no &ldquo;Powered by Testimoni&rdquo; badge</li>
            <li>• 30 deeper praise scans a month and a weekly re-scan</li>
          </ul>
        </div>
        <div className="shrink-0">
          <StartTrialButton surface="dashboard_banner" />
        </div>
      </div>
    );
  }

  const left = Math.max(0, daysLeft ?? 0);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-primary" />
          <p className="font-semibold">
            Pro trial: {left} day{left === 1 ? "" : "s"} left
          </p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Try the{" "}
          <Link href="/dashboard/proof-placement" className="font-medium text-primary underline-offset-4 hover:underline">
            proof placement audit
          </Link>{" "}
          on your site. Keep Pro for $19 a month, or do nothing and you go back to Free. Nothing is deleted either way.
        </p>
      </div>
      <div className="shrink-0">
        <UpgradeProButton surface="trial_active" label="Keep Pro, $19/mo" />
      </div>
    </div>
  );
}
