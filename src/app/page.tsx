import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Star,
  MessageSquare,
  Layout,
  Code,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProPriceDual } from "@/components/pricing/price-display";

export default async function LandingPage() {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {}

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Testimoni</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/demo" className="text-sm text-muted-foreground hover:text-foreground">
              Live Demo
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            {isLoggedIn ? (
              <Button size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started Free</Button>
                </Link>
              </>
            )}
          </nav>
          <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="md:hidden">
            <Button size="sm">{isLoggedIn ? "Dashboard" : "Get Started"}</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center md:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-sm">
            <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
            Trusted by 500+ businesses
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Turn customer love into{" "}
            <span className="text-primary">social proof</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Collect, manage, and embed beautiful testimonials on your website in
            minutes. No coding required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Collecting Testimonials
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free plan available. No credit card required.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-3xl font-bold">
            Everything you need for social proof
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            From collection to display, we handle the entire testimonial workflow.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: "Collect Testimonials",
                description:
                  "Share a beautiful form with customers. Collect text, video, and star ratings effortlessly.",
              },
              {
                icon: Layout,
                title: "Wall of Love Layouts",
                description:
                  "Grid, masonry, carousel, marquee — choose the perfect layout for your brand.",
              },
              {
                icon: Code,
                title: "Easy Embed",
                description:
                  "Drop a single script tag on your site. Works with any website or framework.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description:
                  "Under 10KB widget with CDN caching. Zero impact on your page load speed.",
              },
              {
                icon: Shield,
                title: "Approve & Curate",
                description:
                  "Review submissions before they go live. Full control over what gets displayed.",
              },
              {
                icon: Star,
                title: "Import Reviews",
                description:
                  "Pull in existing reviews from Twitter, LinkedIn, and other platforms.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg border bg-card p-6">
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-3xl font-bold">
            Get started in 3 steps
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create a collection form",
                description: "Set up a branded form and share the link with your customers.",
              },
              {
                step: "2",
                title: "Curate your wall of love",
                description: "Review submissions, approve the best ones, and organize them.",
              },
              {
                step: "3",
                title: "Embed on your site",
                description: "Copy the embed code and paste it anywhere on your website.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">
            Start free, upgrade when you need more.
          </p>
          <div className="mt-12 mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-lg border bg-card p-8 text-left">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-2 text-3xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground">Forever free</p>
              <ul className="mt-6 space-y-3">
                {["10 testimonials", "1 widget", "Grid layout", "Collection forms"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
            {/* Pro */}
            <div className="relative rounded-lg border-2 border-primary bg-card p-8 text-left">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-2 text-3xl font-bold"><ProPriceDual primary="USD" /></p>
              <p className="text-sm text-muted-foreground">Everything unlimited</p>
              <ul className="mt-6 space-y-3">
                {[
                  "Unlimited testimonials",
                  "Unlimited widgets",
                  "All layouts",
                  "Video testimonials",
                  "Custom branding",
                  "No watermark",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button className="w-full">Start Free, Upgrade Anytime</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">
            Ready to showcase your customer love?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join hundreds of businesses using Testimoni to convert visitors with social proof.
          </p>
          <Link href="/signup" className="mt-8 inline-block">
            <Button size="lg" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold">Testimoni</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2024 Testimoni. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
