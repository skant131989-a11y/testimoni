import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { ProPriceDual } from "@/components/pricing/price-display";
import { PublicNav } from "@/components/layout/public-nav";
import { createClient } from "@/lib/supabase/server";

export default async function PricingPage() {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    isLoggedIn = false;
  }

  const proHref = isLoggedIn ? "/dashboard/settings/billing" : "/signup";
  const proLabel = isLoggedIn ? "Upgrade to Pro" : "Start Free, Upgrade Anytime";
  const freeHref = isLoggedIn ? "/dashboard" : "/signup";
  const freeLabel = isLoggedIn ? "Go to Dashboard" : "Get Started Free";

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      {/* Pricing */}
      <main className="flex-1 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when you&apos;re ready to go pro.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 md:max-w-4xl md:mx-auto">
            {/* Free Plan */}
            <div className="rounded-2xl border bg-card p-8">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="mt-2 text-4xl font-bold">
                $0
                <span className="text-base font-normal text-muted-foreground">
                  /month
                </span>
                <span className="ml-2 align-middle text-base font-normal text-muted-foreground">
                  (₹0)
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Perfect for getting started
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Up to 10 testimonials",
                  "1 widget",
                  "Grid layout",
                  "Collection forms",
                  "Email support",
                  "Script tag embed",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={freeHref} className="mt-8 block">
                <Button variant="outline" className="w-full" size="lg">
                  {freeLabel}
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-2xl border-2 border-primary bg-card p-8">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="mt-2 text-4xl font-bold">
                <ProPriceDual suffix="/month" primary="USD" />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                For growing businesses
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Unlimited testimonials",
                  "Unlimited collection forms",
                  "Unlimited widgets",
                  "Curate different testimonials per widget",
                  "All layouts (Grid, Masonry, Carousel, List, Marquee)",
                  "Video testimonials",
                  "Custom branding & colors",
                  "Remove 'Powered by' watermark",
                  "Import from Twitter/LinkedIn",
                  "Analytics dashboard",
                  "Priority support",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={proHref} className="mt-8 block">
                <Button className="w-full" size="lg">
                  {proLabel}
                </Button>
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold">Frequently Asked Questions</h2>
            <div className="mt-8 space-y-6">
              {[
                {
                  q: "Can I try before upgrading?",
                  a: "Yes! The free plan is fully functional with 10 testimonials and 1 widget. No credit card required.",
                },
                {
                  q: "Can I show different testimonials on different pages?",
                  a: "Yes — that's the point. Create one form (or many) to collect. Every approved testimonial lives in one library. Then build separate widgets for your homepage, pricing page, product pages, etc. Each widget picks which testimonials to show, and you can use any layout per widget. The same testimonial can appear in multiple widgets, or nowhere at all.",
                },
                {
                  q: "How many forms and widgets can I have?",
                  a: "Free plan: 1 form, 1 widget, 10 testimonials. Pro: unlimited forms and widgets. Most Pro customers run 1-3 forms (one per collection channel) and 2-5 widgets (one per page they want testimonials on).",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Absolutely. Cancel with one click from your billing settings. No lock-in, no cancellation fees.",
                },
                {
                  q: "What happens if I downgrade?",
                  a: "Your existing testimonials and widgets remain, but you won't be able to add more beyond free tier limits. Pro-only layouts will show the grid fallback.",
                },
                {
                  q: "Do you offer annual billing?",
                  a: "Not yet, but it's on our roadmap. Subscribe to our newsletter to be notified.",
                },
              ].map((faq) => (
                <div key={faq.q} className="rounded-lg border p-6">
                  <h3 className="font-semibold">{faq.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold">Testimoni</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/demo" className="text-muted-foreground hover:text-foreground">Demo</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; 2024 Testimoni. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
