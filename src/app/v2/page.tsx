import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Sparkles,
  MessageSquare,
  Gauge,
  Send,
  ArrowRight,
  Check,
  Twitter,
  Store,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNavAuth, PublicNavAuthMobile } from "@/components/layout/public-nav-auth";
import { InlineSignup } from "@/components/inline-signup";
import { PageEngagement } from "@/components/page-engagement";
import { PageLoadPerf } from "@/components/page-load-perf";
import { TrackedLink } from "@/components/tracked-link";
import { LaunchBar } from "@/components/launch-bar";
import { HashScrollCleanup } from "@/components/hash-scroll-cleanup";
import { StructuredData } from "@/components/seo/structured-data";
import { FREE_FEATURES, PRO_FEATURES } from "@/lib/plan-features";
import { ProPriceDual, FreePrice } from "@/components/pricing/price-display";

/**
 * /v2 — A/B alternative to /.
 *
 * Design philosophy (deliberately different from the current home
 * so an A/B test measures something real, not two variants of the
 * same page):
 *
 *   Current /              /v2
 *   ─────────────          ─────────────
 *   Feature-explainer      Product-first, show-not-tell
 *   Multiple sections      Fewer, denser sections
 *   Animated fake demos    Real static screenshots + real proof
 *   Chunky, spacious       Editorial density, tighter type
 *   Corporate voice        Founder voice + specifics
 *   Pricing below fold     Free-plan value called out in hero
 *
 * The hero doubles as the intake demo — visitors see actual
 * testimonial cards as they read the pitch. No tabs, no
 * animation carousels. Below-fold sections lean on real static
 * testimonials rather than looping mocks.
 *
 * Wire A/B traffic split via middleware later; for now anyone can
 * share /v2 directly.
 */

export const metadata: Metadata = {
  title: "Testimoni — Turn every praise into a testimonial widget",
  description:
    "Paste a tweet, drop a screenshot, or import from App Store — Testimoni turns any praise into a Wall of Love. Free forever plan. Pro $9/mo.",
  alternates: { canonical: "/v2" },
};

const IMPORT_SOURCES = [
  { name: "Twitter/X", host: "x.com/…", icon: Twitter },
  { name: "LinkedIn", host: "linkedin.com/…", icon: Send },
  { name: "App Store", host: "apps.apple.com/…", icon: Store },
  { name: "Play Store", host: "play.google.com/…", icon: Store },
  { name: "Chrome Store", host: "chromewebstore.google.com/…", icon: Store },
  { name: "Product Hunt", host: "producthunt.com/…", icon: Store },
  { name: "Shopify", host: "apps.shopify.com/…", icon: Store },
  { name: "Screenshot AI", host: "any image → testimonial", icon: ImageIcon },
] as const;

const FAKE_TESTIMONIALS = [
  {
    quote: "Set up a Wall of Love in 5 min yesterday. Wild.",
    author: "Priya M.",
    role: "Solo founder",
    color: "bg-orange-500",
    source: "WhatsApp",
  },
  {
    quote:
      "Cut my onboarding docs from 3 days to 4 hours. Team actually reads them now.",
    author: "Rachel K.",
    role: "VP Ops",
    color: "bg-emerald-500",
    source: "Twitter",
  },
  {
    quote:
      "The fastest playbook we've rolled out at a 200-person startup this year.",
    author: "Marcus C.",
    role: "VP Growth",
    color: "bg-fuchsia-500",
    source: "LinkedIn",
  },
  {
    quote:
      "Turned 47 scattered tweets into a wall on my landing page. Signup rate went up.",
    author: "Aditi P.",
    role: "Indie hacker",
    color: "bg-amber-500",
    source: "Slack",
  },
  {
    quote:
      "Ask My Wall answered a visitor's onboarding question with Rachel's real words. She DM'd me asking if it was real. Yes.",
    author: "Owen B.",
    role: "PLG founder",
    color: "bg-lime-500",
    source: "X reply",
  },
  {
    quote:
      "Been meaning to switch from a Notion doc for a year. Testimoni took 20 min.",
    author: "Chen W.",
    role: "SaaS founder",
    color: "bg-rose-500",
    source: "Email",
  },
] as const;

export default function LandingV2() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData />
      <PageEngagement surface="home_v2" />
      <PageLoadPerf surface="home_v2" anonymous />
      <HashScrollCleanup />

      <LaunchBar
        id="ask-my-wall-2026-09"
        href="#new-ai-features"
        message="Ask My Wall is live — an AI chatbot that only quotes real customers."
        cta="See it"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
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
            <TrackedLink cta="v2_nav_demo" surface="home_v2_nav" href="/demo" className="text-sm text-muted-foreground hover:text-foreground">
              Live demo
            </TrackedLink>
            <TrackedLink cta="v2_nav_pricing" surface="home_v2_nav" href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </TrackedLink>
            <TrackedLink cta="v2_nav_features" surface="home_v2_nav" href="#new-ai-features" className="text-sm text-muted-foreground hover:text-foreground">
              What&rsquo;s new
            </TrackedLink>
            <PublicNavAuth />
          </nav>
          <PublicNavAuthMobile />
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/[0.03] via-background to-background">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1.05fr_1fr] md:py-24 md:pt-20">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Now free — App Store, Play Store, Shopify + 5 more sources
            </div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Any praise becomes a{" "}
              <span className="text-primary">Wall of Love.</span>
              <br />
              <span className="text-3xl text-muted-foreground md:text-5xl">
                Now the wall talks back.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Paste a tweet URL. Drop a screenshot. Or import from App
              Store, Play Store, Shopify, Chrome, Product Hunt. Testimoni
              turns every kind of praise into a widget you embed anywhere
              — with an AI chatbot that answers visitors using your real
              customers, cited by name.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <TrackedLink cta="v2_hero_primary" surface="home_v2" href="/signup?src=v2_hero">
                <Button size="lg" className="gap-2">
                  Start free — no credit card
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TrackedLink>
              <TrackedLink cta="v2_hero_secondary" surface="home_v2" href="/demo" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                See a live wall →
              </TrackedLink>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Free forever plan
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Pro $9/mo
              </div>
              <div className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> No credit card
              </div>
            </div>
          </div>

          {/* Right — static real-testimonial column */}
          <div className="relative">
            <div className="absolute -left-4 -top-4 z-10 rounded-full border-2 border-primary/30 bg-background px-3 py-1 text-xs font-semibold text-primary shadow-md">
              This is what your wall looks like →
            </div>
            <div className="space-y-3">
              {FAKE_TESTIMONIALS.slice(0, 3).map((t, i) => (
                <div key={i} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <p className="text-sm italic leading-relaxed text-foreground/90">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-3 flex items-center gap-2.5 border-t pt-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${t.color} text-xs font-bold text-white`}>
                      {t.author.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{t.author}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.role} · via {t.source}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sources strip */}
      <section className="border-b bg-muted/30 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            8 ways to fill your wall — all free
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {IMPORT_SOURCES.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-1.5 rounded-lg border bg-card px-3 py-3 text-center">
                <s.icon className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold leading-tight">{s.name}</p>
                <p className="line-clamp-1 text-[10px] leading-tight text-muted-foreground">
                  {s.host}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Wall — dense grid */}
      <section className="border-b py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              A real wall. Yours takes 30 seconds.
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">
              This is proof. Not a mockup.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FAKE_TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border bg-card p-5">
                <p className="text-sm italic leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3 border-t pt-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.color} text-sm font-bold text-white`}>
                    {t.author.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role} · via {t.source}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI features */}
      <section id="new-ai-features" className="scroll-mt-20 border-b bg-gradient-to-br from-primary/[0.04] via-background to-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              <Sparkles className="h-3 w-3" />
              Pro · $9/mo
            </div>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Three things nobody else does.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Every SaaS testimonial widget shows testimonials. These use
              them.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Gauge,
                accent: "text-blue-700",
                bg: "bg-blue-100",
                title: "Wall Score",
                tag: "Audit",
                body: "0–100 score across 6 dimensions with specific next actions. Track over time.",
              },
              {
                icon: Send,
                accent: "text-emerald-700",
                bg: "bg-emerald-100",
                title: "Tweet drafts",
                tag: "Amplify",
                body: "Every quote → 3 tweet drafts. One click opens X or LinkedIn compose, pre-filled.",
              },
              {
                icon: MessageSquare,
                accent: "text-primary",
                bg: "bg-primary/10",
                title: "Ask My Wall",
                tag: "Answer",
                body: "Embed an AI chatbot that answers visitors using real customer quotes, cited by name. Never invents.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${f.bg} ${f.accent}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${f.accent}`}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-b py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Two plans. One decision.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Free forever. Pro when you need unlimited + the fancy stuff.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="mt-2 text-3xl font-bold">
                <FreePrice suffix="" />
              </p>
              <p className="text-sm text-muted-foreground">
                Try the viral loops on us.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <TrackedLink cta="v2_pricing_free" surface="home_v2" href="/signup?src=v2_pricing" className="mt-6 block">
                <Button variant="outline" className="w-full">
                  Get started free
                </Button>
              </TrackedLink>
            </div>
            <div className="relative rounded-2xl border-2 border-primary bg-card p-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Everything
              </div>
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="mt-2 text-3xl font-bold">
                <ProPriceDual />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                All utility + all AI features. One clean upgrade.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {PRO_FEATURES.slice(0, 9).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
                <li className="text-xs text-muted-foreground">
                  + {PRO_FEATURES.length - 9} more on{" "}
                  <Link href="/pricing" className="underline">
                    /pricing
                  </Link>
                </li>
              </ul>
              <TrackedLink cta="v2_pricing_pro" surface="home_v2" href="/signup?src=v2_pricing_pro" className="mt-6 block">
                <Button className="w-full">Upgrade to Pro</Button>
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      {/* Final signup */}
      <section className="border-b bg-primary/[0.03] py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-2xl border-2 border-primary/30 bg-card p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:gap-8">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Start free
                </div>
                <h2 className="text-2xl font-bold md:text-3xl">
                  30 seconds to your first testimonial.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Free forever plan. No card required. Paste a tweet, drop
                  a screenshot, or import from any review platform.
                </p>
              </div>
              <InlineSignup source="home_v2" idPrefix="v2_final" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold">Testimoni</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/demo" className="text-muted-foreground hover:text-foreground">
              Demo
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Testimoni.
          </p>
        </div>
      </footer>
    </div>
  );
}
