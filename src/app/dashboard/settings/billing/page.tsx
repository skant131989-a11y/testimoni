"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
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
import { PLAN_LIMITS, PRICING } from "@/lib/constants";
import { usePricing } from "@/lib/use-pricing";
import { CurrencySwitcher } from "@/components/pricing/price-display";

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

/** Minimal window.Razorpay shape — the SDK is loaded via <Script>. */
declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
  handler?: (response: { razorpay_payment_id: string }) => void;
}

export default function BillingPage() {
  const { currency, proMonthlyFormatted } = usePricing();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage>({ testimonials: 0, widgets: 0 });
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleStripeUpgrade() {
    setUpgrading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Could not start Stripe checkout.");
      }
    } finally {
      setUpgrading(false);
    }
  }

  async function handleRazorpayUpgrade() {
    setUpgrading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/razorpay/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.subscription_id) {
        setError(data.error || "Could not start Razorpay checkout.");
        return;
      }
      if (!window.Razorpay) {
        setError("Razorpay script hasn't loaded yet. Please wait a moment and try again.");
        return;
      }
      const rzp = new window.Razorpay({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "Testimoni",
        description: `Pro plan (${PRICING.INR.symbol}${PRICING.INR.proMonthly}/mo)`,
        prefill: data.prefill,
        theme: { color: "#7c3aed" },
        handler: () => {
          // Payment succeeded — webhook will flip plan to PRO in the background.
          window.location.reload();
        },
      });
      rzp.open();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

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
              {proMonthlyFormatted}/month · Cancel anytime
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
          <CardFooter className="flex-col items-stretch gap-3">
            <div className="flex justify-center">
              <CurrencySwitcher />
            </div>
            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}
            {currency === "INR" ? (
              <Button
                onClick={handleRazorpayUpgrade}
                disabled={upgrading}
                className="w-full"
              >
                {upgrading
                  ? "Opening Razorpay…"
                  : `Pay with Razorpay · ${proMonthlyFormatted}/mo`}
              </Button>
            ) : (
              <Button
                onClick={handleStripeUpgrade}
                disabled={upgrading}
                className="w-full"
              >
                {upgrading
                  ? "Redirecting to Stripe…"
                  : `Pay with card · ${proMonthlyFormatted}/mo`}
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              {currency === "INR"
                ? "UPI, cards, netbanking — settles to your INR account"
                : "Powered by Stripe · secure checkout"}
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
