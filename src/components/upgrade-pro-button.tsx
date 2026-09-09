"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { detectCurrency, type Currency } from "@/lib/constants";
import { track } from "@/lib/analytics";
import "@/lib/razorpay-window";

/**
 * One-click "Upgrade to Pro" button.
 *
 * The old flow was: click Upgrade → land on /dashboard/settings/billing
 * → click Upgrade again → Razorpay opens. Two full clicks + a page load
 * for the user to give us money.
 *
 * This button collapses that to one click, from anywhere in the
 * dashboard. Sequence on click:
 *   1. Detect currency (INR / USD from timezone).
 *   2. Lazy-load Razorpay checkout.js (~30KB, only on demand).
 *   3. POST /api/billing/razorpay/checkout to open a subscription.
 *   4. Show Razorpay's own modal.
 *   5. On payment success: poll /api/billing/razorpay/verify until
 *      the plan flips, then reload the page so Pro state renders
 *      everywhere.
 *
 * /dashboard/settings/billing stays as-is for edge cases:
 * currency switching, cancellation, subscription details.
 *
 * ─── Design choices ─────────────────────────────────────────
 * - No currency toggle in this button. 95% of users accept the
 *   detected currency; the 5% who don't can go to /billing manually.
 *   A toggle here would rebuild the two-step problem.
 * - Errors surface as an alert() rather than inline state so the
 *   button stays stateless across surfaces (settings, walls,
 *   inbox limits — they all just want "click, upgrade, done").
 * - Same analytics event name as the billing page: `upgrade_clicked`,
 *   so upgrade attribution comparisons across surfaces are honest.
 *   Extra `surface` prop lets us slice which trigger converted.
 */

declare global {
  interface Window {
    Razorpay?: new (opts: import("@/lib/razorpay-window").RazorpayCheckoutOptions) => { open: () => void };
  }
}

async function ensureRazorpayLoaded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-razorpay]",
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Razorpay script failed to load")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.dataset.razorpay = "true";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.head.appendChild(s);
  });
}

interface UpgradeProButtonProps
  extends Omit<ButtonProps, "onClick" | "children" | "disabled"> {
  /** Where this button lives ("settings", "wall-score", "inbox_limit"...).
   *  Powers analytics so we can compare which trigger converts best. */
  surface: string;
  /** Optional override for the button label. Default: "Upgrade to Pro". */
  label?: React.ReactNode;
  /** Override the auto-detected currency. Rare — only useful when
   *  we already know the user's currency from another signal. */
  currency?: Currency;
  /** If true, reload the whole page after successful payment.
   *  Default true. Set false when a surrounding component wants to
   *  handle its own refresh. */
  reloadOnSuccess?: boolean;
}

export function UpgradeProButton({
  surface,
  label,
  currency: currencyProp,
  reloadOnSuccess = true,
  ...buttonProps
}: UpgradeProButtonProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleClick() {
    setUpgrading(true);
    const currency = currencyProp ?? detectCurrency();
    track("upgrade_clicked", { currency, plan: "PRO", surface });
    try {
      await ensureRazorpayLoaded();

      const res = await fetch("/api/billing/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const data = await res.json();
      if (!res.ok || !data.subscription_id) {
        alert(data.error || "Could not start Razorpay checkout.");
        setUpgrading(false);
        return;
      }
      if (!window.Razorpay) {
        alert("Razorpay didn't load. Please refresh and try again.");
        setUpgrading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "Testimoni",
        description: "Pro plan",
        prefill: data.prefill,
        theme: { color: "#7c3aed" },
        handler: async () => {
          // Verify server-side so plan flips without waiting on the
          // webhook. Poll for ~10s — Razorpay's own state can lag by
          // a beat right after the modal closes.
          setVerifying(true);
          try {
            for (let attempt = 0; attempt < 6; attempt += 1) {
              const vr = await fetch("/api/billing/razorpay/verify", {
                method: "POST",
              });
              const vd = await vr.json();
              if (vd.plan === "PRO") {
                if (reloadOnSuccess) window.location.reload();
                return;
              }
              await new Promise((r) => setTimeout(r, 1500));
            }
            // Still not Pro after 10s — reload anyway. Webhook will
            // catch up in the background and the reloaded page will
            // reflect it on next nav.
            if (reloadOnSuccess) window.location.reload();
          } catch {
            if (reloadOnSuccess) window.location.reload();
          }
        },
        modal: {
          ondismiss: () => setUpgrading(false),
        },
      });
      rzp.open();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong");
      setUpgrading(false);
    }
  }

  const busy = upgrading || verifying;

  return (
    <Button onClick={handleClick} disabled={busy} {...buttonProps}>
      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label ??
        (verifying
          ? "Confirming payment…"
          : upgrading
            ? "Loading checkout…"
            : "Upgrade to Pro")}
    </Button>
  );
}
