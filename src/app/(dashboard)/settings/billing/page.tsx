"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap } from "lucide-react";
import { PLAN_LIMITS, PRO_PRICE_MONTHLY } from "@/lib/constants";

interface Subscription {
  plan: "FREE" | "PRO";
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface Usage {
  testimonials: number;
  widgets: number;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage>({ testimonials: 0, widgets: 0 });
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetch("/api/billing/checkout")
      .then((r) => r.json())
      .then((data) => {
        setSubscription(data.subscription);
        setUsage(data.usage || { testimonials: 0, widgets: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setUpgrading(false);
    }
  }

  async function handleManageBilling() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Billing</h1>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const isPro = subscription?.plan === "PRO";
  const limits = PLAN_LIMITS[isPro ? "PRO" : "FREE"];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing</h1>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {isPro ? "You're on the Pro plan" : "You're on the Free plan"}
              </CardDescription>
            </div>
            <Badge variant={isPro ? "default" : "secondary"} className="text-base px-3 py-1">
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Testimonials</p>
              <p className="mt-1 text-2xl font-bold">
                {usage.testimonials}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}/ {limits.maxTestimonials === Infinity ? "∞" : limits.maxTestimonials}
                </span>
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Widgets</p>
              <p className="mt-1 text-2xl font-bold">
                {usage.widgets}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}/ {limits.maxWidgets === Infinity ? "∞" : limits.maxWidgets}
                </span>
              </p>
            </div>
          </div>
          {subscription?.cancelAtPeriodEnd && (
            <p className="mt-4 text-sm text-destructive">
              Your plan will be canceled at the end of the current period
              ({subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : ""}).
            </p>
          )}
        </CardContent>
        {isPro && (
          <CardFooter>
            <Button variant="outline" onClick={handleManageBilling}>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Upgrade Card (shown for free users) */}
      {!isPro && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Upgrade to Pro
            </CardTitle>
            <CardDescription>
              ${PRO_PRICE_MONTHLY}/month · Cancel anytime
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                "Unlimited testimonials",
                "Unlimited widgets",
                "All layouts (Masonry, Carousel, Marquee...)",
                "Video testimonials",
                "Custom branding",
                "Remove 'Powered by' watermark",
                "Priority support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpgrade} disabled={upgrading} className="w-full">
              {upgrading ? "Redirecting to checkout..." : `Upgrade for $${PRO_PRICE_MONTHLY}/month`}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
