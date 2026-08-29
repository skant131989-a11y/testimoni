import Link from "next/link";
import Image from "next/image";
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
import { StructuredData } from "@/components/seo/structured-data";
import { InlineSignup } from "@/components/inline-signup";
import { TrackedLink } from "@/components/tracked-link";

export default async function LandingPage() {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {}

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData />
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={28}
              height={28}
              className="rounded-full"
              priority
            />
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
            Just launched · Free forever plan
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Collect testimonials.{" "}
            <span className="text-primary">Embed them on your site today.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Collect via link, form, or QR. Approve the ones you love, drop them
            into a widget, and embed with one line of code. Free plan.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <TrackedLink cta="hero_signup" surface="home" href="/signup">
              <Button size="lg" className="gap-2">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TrackedLink>
            <TrackedLink cta="hero_pricing" surface="home" href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </TrackedLink>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free plan available. No credit card required.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            <TrackedLink cta="hero_wall_demo" surface="home" href="/w/demo" className="font-medium text-primary hover:underline">
              See a live Wall of Love →
            </TrackedLink>
          </p>
        </div>

        {/* Animated demo preview — CSS-only, no video/GIF */}
        <div className="mt-16">
          <AnimatedDemo />
        </div>
      </section>

      {/* Tweet-import call-out — the "start collecting today with zero customers" story */}
      <section className="border-y bg-gradient-to-br from-blue-50/40 via-background to-purple-50/40 py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
                <Zap className="h-3 w-3" />
                Instant library
              </div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Already have tweets praising you?
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Paste an{" "}
                <span className="font-semibold text-foreground">X (Twitter)</span>{" "}
                or{" "}
                <span className="font-semibold text-foreground">LinkedIn</span>{" "}
                post URL — we pull the author and text, drop an approved
                testimonial into your library, and add it to your wall in one
                click. No screenshots. No copy-paste.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <TrackedLink cta="tweet_import_signup" surface="home" href="/signup">
                    Try it free <ArrowRight className="ml-2 h-4 w-4" />
                  </TrackedLink>
                </Button>
                <Button variant="outline" asChild>
                  <TrackedLink cta="tweet_import_features" surface="home" href="/features">See all features</TrackedLink>
                </Button>
              </div>
            </div>

            {/* Visual: mock URL bar + arrow + card */}
            <div className="hidden max-w-sm rounded-2xl border bg-card p-4 shadow-sm md:block">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Paste a URL
              </div>
              <div className="rounded-md border bg-muted/60 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                https://x.com/user/status/…
              </div>
              <div className="my-3 flex items-center gap-2 text-[11px] font-medium text-primary">
                <ArrowRight className="h-3.5 w-3.5" />
                Approved &amp; live on your wall
              </div>
              <div className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    S
                  </div>
                  <div className="text-xs font-semibold">Sarah Chen</div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  &ldquo;Testimoni turned a mess of tweets into a wall of love
                  in about 30 seconds.&rdquo;
                </p>
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
                title: "Paste-a-tweet import",
                description:
                  "Turn a public X or LinkedIn post into an approved testimonial by pasting the URL. Author and text pulled automatically; you edit the rating if you want.",
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
                title: "Share a collection form",
                description: "We create your first form on signup. Share the link, embed a floating button, or drop a QR code on your packaging.",
              },
              {
                step: "2",
                title: "Approve in one click",
                description: "Review each submission in your inbox. Approve — and it&apos;s instantly on your wall. No extra steps.",
              },
              {
                step: "3",
                title: "Share or embed the wall",
                description: "Every workspace gets a hosted Wall of Love URL. Paste it in your bio, or copy one line of code to embed anywhere.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.description }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us — differentiators vs Senja / Testimonial.to */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Shield className="h-3 w-3" />
              Honest comparison
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Why Testimoni over other tools?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              We&apos;re new. Senja and Testimonial.to are mature. Here&apos;s
              the honest set of trade-offs that made building this worth it.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
              <div className="text-3xl">🌐</div>
              <h3 className="mt-3 text-lg font-bold">
                Hosted wall on the free plan
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every workspace gets a public URL you can drop in your
                Instagram bio on day one. Competitors gate this behind Pro.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
              <div className="text-3xl">⚡</div>
              <h3 className="mt-3 text-lg font-bold">Auto-add on approve</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                One click puts a testimonial on your wall instantly. No
                separate curation step. Others make you pick and drop by hand.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
              <div className="text-3xl">💸</div>
              <h3 className="mt-3 text-lg font-bold">
                $9/mo Pro · ₹859 in India
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Half the price of Senja. One-fifth of Testimonial.to.
                Native INR pricing for Indian founders — no forex
                middleman.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
              <div className="text-3xl">🚢</div>
              <h3 className="mt-3 text-lg font-bold">Ships weekly</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Solo founder. Every feature request from a paying customer
                gets a real answer, and the roadmap is user-driven, not
                board-driven.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="text-muted-foreground">Full comparisons →</span>
            <TrackedLink
              cta="vs_senja"
              surface="home"
              href="/vs/senja"
              className="rounded-full border px-3 py-1 font-medium text-primary hover:bg-primary/5"
            >
              vs Senja
            </TrackedLink>
            <TrackedLink
              cta="vs_testimonial_to"
              surface="home"
              href="/vs/testimonial-to"
              className="rounded-full border px-3 py-1 font-medium text-primary hover:bg-primary/5"
            >
              vs Testimonial.to
            </TrackedLink>
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
              <TrackedLink cta="pricing_preview_free" surface="home" href="/signup" className="mt-8 block">
                <Button variant="outline" className="w-full">Get Started</Button>
              </TrackedLink>
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
              <TrackedLink cta="pricing_preview_pro" surface="home" href="/signup" className="mt-8 block">
                <Button className="w-full">Start Free, Upgrade Anytime</Button>
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:gap-10">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold">
                Ready to showcase your customer love?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Get set up in 5 minutes. Free forever plan. No credit card required.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>✓ 10 testimonials, 1 form, 1 widget on the Free plan</li>
                <li>✓ Public Wall of Love URL — shareable anywhere</li>
                <li>✓ One-line embed for any site (Framer, Webflow, WordPress, React)</li>
              </ul>
            </div>
            <InlineSignup source="home_bottom" idPrefix="home-bottom" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="font-semibold">Testimoni</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link href="/demo" className="text-muted-foreground hover:text-foreground">Demo</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
            <a
              href="https://x.com/usetestimoni"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Testimoni on X (Twitter)"
            >
              X
            </a>
            <a
              href="https://www.linkedin.com/company/144771086"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Testimoni on LinkedIn"
            >
              LinkedIn
            </a>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; 2024 Testimoni. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
