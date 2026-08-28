"use client";

import { useEffect, useState } from "react";

interface SubscriptionInfo {
  plan: "FREE" | "PRO";
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface UsageInfo {
  testimonials: number;
  widgets: number;
  forms?: number; // future-proof, endpoint currently returns 0
}

interface LimitsInfo {
  maxTestimonials: number;
  maxWidgets: number;
  maxForms: number;
}

const FREE_LIMITS: LimitsInfo = { maxTestimonials: 10, maxWidgets: 1, maxForms: 1 };
const PRO_LIMITS: LimitsInfo = {
  maxTestimonials: Infinity,
  maxWidgets: Infinity,
  maxForms: Infinity,
};

/**
 * Fetch the current workspace's plan + usage counts from
 * /api/billing/subscription. Client pages use this to disable
 * create buttons when limits are reached and surface an upgrade CTA
 * before the user hits the API error.
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo>({ testimonials: 0, widgets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((data) => {
        setSubscription(data.subscription ?? null);
        setUsage(data.usage ?? { testimonials: 0, widgets: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const plan = subscription?.plan ?? "FREE";
  const limits = plan === "PRO" ? PRO_LIMITS : FREE_LIMITS;

  return { subscription, usage, plan, limits, loading };
}
