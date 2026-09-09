"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracked-link";
import { UpgradeProButton } from "@/components/upgrade-pro-button";
import { createClient } from "@/lib/supabase/client";

/**
 * Client wrapper for the pricing page CTA buttons. Renders anonymous
 * defaults (Get Started Free / Start Free, Upgrade Anytime) so the
 * whole /pricing route can be statically pre-rendered. Swaps to
 * account-aware copy once we've confirmed a session + plan.
 *
 * Three flows:
 *   1. Anonymous          → Signup link
 *   2. Logged in on Free  → One-click Razorpay via <UpgradeProButton>
 *   3. Logged in on Pro   → "Manage subscription" link to billing
 *
 * plan="free" | "pro" | "pro_ai" — different href + label per card.
 */
export function PricingCta({ plan }: { plan: "free" | "pro" | "pro_ai" }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<"FREE" | "PRO" | "PRO_AI" | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      const loggedIn = !!data.user;
      setIsLoggedIn(loggedIn);
      if (!loggedIn) return;
      // Only Pro/Pro AI cards care about current plan (to decide
      // whether to show "Upgrade" vs "Manage").
      if (plan === "free") return;
      try {
        const res = await fetch("/api/billing/subscription");
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled) setCurrentPlan(body?.subscription?.plan ?? "FREE");
      } catch {
        // On network error we assume FREE so the button opens Razorpay
        // rather than sending the user to a manage-only page they
        // can't act on.
      }
    });
    return () => {
      cancelled = true;
    };
  }, [plan]);

  // Free-plan card is the same across all users — click goes to
  // dashboard if logged in, signup if not.
  if (plan === "free") {
    return (
      <TrackedLink
        cta="pricing_free_plan"
        surface="pricing"
        href={isLoggedIn ? "/dashboard" : "/signup"}
        className="mt-8 block"
      >
        <Button variant="outline" className="w-full" size="lg">
          {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
        </Button>
      </TrackedLink>
    );
  }

  // Anonymous on Pro / Pro AI cards → signup with tier hint.
  if (!isLoggedIn) {
    return (
      <TrackedLink
        cta={plan === "pro_ai" ? "pricing_pro_ai_plan" : "pricing_pro_plan"}
        surface="pricing"
        href="/signup"
        className="mt-8 block"
      >
        <Button className="w-full" size="lg">
          {plan === "pro_ai"
            ? "Try Free — Upgrade to Pro AI Anytime"
            : "Start Free, Upgrade Anytime"}
        </Button>
      </TrackedLink>
    );
  }

  // Logged in, already on Pro (or Pro AI when we bring it back) →
  // send them to billing to manage. No sense re-selling.
  if (currentPlan && currentPlan !== "FREE") {
    return (
      <TrackedLink
        cta={plan === "pro_ai" ? "pricing_pro_ai_manage" : "pricing_pro_manage"}
        surface="pricing"
        href="/dashboard/settings/billing"
        className="mt-8 block"
      >
        <Button variant="outline" className="w-full" size="lg">
          Manage subscription
        </Button>
      </TrackedLink>
    );
  }

  // Logged in on Free → one-click Razorpay via the shared button.
  // Kept full-width + size="lg" to match the other pricing CTAs.
  return (
    <div className="mt-8">
      <UpgradeProButton
        surface={plan === "pro_ai" ? "pricing_pro_ai" : "pricing_pro"}
        size="lg"
        className="w-full"
        label={plan === "pro_ai" ? "Upgrade to Pro AI" : "Upgrade to Pro"}
      />
    </div>
  );
}
