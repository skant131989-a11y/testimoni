"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracked-link";
import { createClient } from "@/lib/supabase/client";

/**
 * Client wrapper for the pricing page CTA buttons. Renders anonymous
 * defaults (Get Started Free / Start Free, Upgrade Anytime) so the
 * whole /pricing route can be statically pre-rendered. Swaps to
 * Dashboard-flavored copy once we've confirmed a logged-in session.
 *
 * plan="free" or plan="pro" — different href + label per plan card.
 */
export function PricingCta({ plan }: { plan: "free" | "pro" }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setIsLoggedIn(!!data.user);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cfg =
    plan === "pro"
      ? {
          href: isLoggedIn ? "/dashboard/settings/billing" : "/signup",
          label: isLoggedIn ? "Upgrade to Pro" : "Start Free, Upgrade Anytime",
          cta: "pricing_pro_plan",
          variant: undefined as "outline" | undefined,
        }
      : {
          href: isLoggedIn ? "/dashboard" : "/signup",
          label: isLoggedIn ? "Go to Dashboard" : "Get Started Free",
          cta: "pricing_free_plan",
          variant: "outline" as const,
        };

  return (
    <TrackedLink cta={cfg.cta} surface="pricing" href={cfg.href} className="mt-8 block">
      <Button variant={cfg.variant} className="w-full" size="lg">
        {cfg.label}
      </Button>
    </TrackedLink>
  );
}
