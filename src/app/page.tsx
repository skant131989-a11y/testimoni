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
  Inbox,
  LibraryBig,
  MonitorSmartphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProPriceDual } from "@/components/pricing/price-display";
import { AnimatedDemo } from "@/components/animated-demo";

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

        {/* Animated demo preview — CSS-only, no video/GIF */}
        <div className="mt-16">
          <AnimatedDemo />
        </div>
      </section>

      {/* One library, many widgets — the multi-form/multi-widget story */}
      <section className="border-t bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <LibraryBig className="mr-1 h-3 w-3" />
              Flexible by design
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              One library. Unlimited widgets.<br />
              <span className="text-primary">Curate what shows where.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Collect testimonials from as many channels as you want. Then build
              a different widget for every page — with only the testimonials
              you pick for that spot.
            </p>
          </div>

          {/* Visual mapping */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Column 1: Forms */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Multiple forms</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Ask different customers different questions.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-mono">form 1</span>
                  <span>Post-purchase feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-mono">form 2</span>
                  <span>Onboarding experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-mono">form 3</span>
                  <span>Feature request survey</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Library */}
            <div className="relative rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Your library
              </div>
              <div className="mb-3 flex items-center gap-2">
                <LibraryBig className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">One approved pool</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Every approved testimonial lives here — text, video, ratings.
              </p>
              <div className="space-y-2 text-sm">
                {[
                  { name: "Sarah Chen", rating: 5 },
                  { name: "Marcus Johnson", rating: 5 },
                  { name: "Emily Rodriguez", rating: 5 },
                  { name: "Alex Kumar", rating: 4 },
                  { name: "+12 more approved", rating: 0 },
                ].map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center justify-between rounded-md border bg-background px-3 py-1.5 text-xs"
                  >
                    <span>{t.name}</span>
                    {t.rating > 0 && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Widgets */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Multiple widgets</h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Different subset per page. Different layout per widget.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border px-1.5 py-0.5 text-[10px] font-mono">widget A</span>
                    <span className="font-medium">Homepage grid</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    6 hand-picked bangers, masonry layout
                  </p>
                </li>
                <li className="rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border px-1.5 py-0.5 text-[10px] font-mono">widget B</span>
                    <span className="font-medium">Pricing carousel</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enterprise customers only
                  </p>
                </li>
                <li className="rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border px-1.5 py-0.5 text-[10px] font-mono">widget C</span>
                    <span className="font-medium">Product page marquee</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    5-star reviews only
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Real-world use cases */}
          <div className="mt-10 rounded-2xl border bg-background p-6">
            <p className="text-sm font-semibold">Real setups</p>
            <div className="mt-3 grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
              <div>
                <p className="font-medium text-foreground">SaaS founder</p>
                <p className="mt-1">2 forms (in-app, post-cancel) · 3 widgets (homepage, pricing, in-app sidebar)</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Course creator</p>
                <p className="mt-1">1 form per cohort · 1 widget per course landing page</p>
              </div>
              <div>
                <p className="font-medium text-foreground">D2C store</p>
                <p className="mt-1">1 form post-delivery · 1 widget per product category</p>
              </div>
            </div>
          </div>
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
