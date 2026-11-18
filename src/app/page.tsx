import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Inbox,
  Play,
  LayoutGrid,
  Search,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import { PublicNavAuth, PublicNavAuthMobile } from "@/components/layout/public-nav-auth";
import { SiteFooter } from "@/components/layout/site-footer";
import { StructuredData } from "@/components/seo/structured-data";
import { ProPrice, FreePrice } from "@/components/pricing/price-display";
import { PricingCta } from "@/components/pricing/pricing-cta";
import { FREE_FEATURES, PRO_FEATURES } from "@/lib/plan-features";
import { COMPETITORS, FACTS_VERIFIED_ON, TESTIMONI } from "@/lib/competitors";
import { HOME_FAQ, SOURCES } from "@/lib/home-content";
import { FindProofForm } from "@/components/home/find-proof-form";
import { HeroWall } from "@/components/home/hero-wall";
import { LiveWall } from "@/components/home/live-wall";
import { LaunchBar } from "@/components/launch-bar";
import { LAUNCH_BAR } from "@/lib/launch-bar";
import { getWallQuotes } from "@/lib/home-wall";
import { HeroDualDemo } from "@/components/hero-dual-demo";
import { StickyMobileCta } from "@/components/sticky-mobile-cta";
import { TrackedLink } from "@/components/tracked-link";
import { PageEngagement } from "@/components/page-engagement";
import { PageLoadPerf } from "@/components/page-load-perf";
import { FadeIn } from "@/components/fade-in";
import { ExitIntent } from "@/components/exit-intent";
import { HashScrollCleanup } from "@/components/hash-scroll-cleanup";

const TITLE = "Testimoni | Collect and find customer testimonials, show them anywhere";
const DESCRIPTION =
  "Collect testimonials with forms (text, star ratings, video) or find real customer posts on X, LinkedIn and Reddit by pasting your website. Approve with a click, then show them on a hosted wall or with one line of code. Free for 15 testimonials; Pro is a flat $19 a month.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/" },
};

const WAYS = [
  {
    Icon: FileText,
    title: "Ask your customers",
    body: "Share a form that takes text, star ratings and video.",
    points: [
      "Send it by link, email, WhatsApp, DM or QR code",
      "Or embed the form on your own site",
      "Approve each one from your inbox",
    ],
    cta: "Create a collection form",
    href: "/signup?src=home_ways_ask",
  },
  {
    Icon: Search,
    title: "Find what's already out there",
    body: "Paste your website. We search X, LinkedIn, Reddit, Product Hunt and app stores for real posts about you.",
    points: [
      "Every quote keeps its author and source link",
      "Free to try, no signup",
      "Pro re-scans weekly and emails new praise",
    ],
    cta: "Find my praise",
    href: "/tools/find-my-proof",
  },
  {
    Icon: Upload,
    title: "Add what you already have",
    body: "Paste a link, drop a screenshot, or pull in store reviews.",
    points: [
      "Tweets, LinkedIn posts, Reddit comments and any public URL",
      "AI reads screenshots of DMs, emails and reviews",
      "App Store, Google Play, Chrome Web Store and Product Hunt reviews",
    ],
    cta: "Try it below",
    href: "#try",
  },
];

// What's included, grouped the way people shop for these tools. Tags
// only where a plan really limits the feature (see lib/plan-features.ts).
const FEATURE_GROUPS: {
  Icon: typeof FileText;
  title: string;
  note?: string;
  items: { text: string; tag?: string }[];
}[] = [
  {
    Icon: FileText,
    title: "Collect",
    items: [
      { text: "Forms with text, star ratings and video", tag: "1 free, unlimited on Pro" },
      { text: "Share by link, email, WhatsApp, DM, QR code or embed" },
      { text: "Ask customers by email, or automatically from a webhook, with a reminder", tag: "3/mo free" },
      { text: "Paste a link or drop a screenshot to add one yourself" },
      { text: "Import reviews from app stores and Product Hunt" },
    ],
  },
  {
    Icon: Inbox,
    title: "Manage",
    items: [
      { text: "One inbox: approve or reject with a click" },
      { text: "Edit the wording, name and title before you publish" },
      { text: "Choose what each widget shows", tag: "Pro" },
      { text: "Analytics on your wall", tag: "Pro" },
    ],
  },
  {
    Icon: LayoutGrid,
    title: "Show",
    items: [
      { text: "A hosted Wall of Love page, free" },
      { text: "One line of code for any site, styles isolated" },
      { text: "Grid free; masonry, carousel, list and marquee", tag: "Pro" },
      { text: "Your branding, no watermark, Trust Score badge", tag: "Pro" },
      { text: "Review markup so Google and AI can read your wall" },
    ],
  },
  {
    Icon: Sparkles,
    title: "Beyond collecting",
    note: "Tools for finding and using praise",
    items: [
      { text: "Find my praise: scan the web for real posts about you" },
      { text: "Customer Voice: praise, complaints and requests, free summary" },
      { text: "Wall Score: audit your wall from 0 to 100", tag: "1 free, unlimited on Pro" },
      { text: "Ask My Wall: a chatbot that quotes your real customers", tag: "30 answers free, unlimited on Pro" },
      { text: "Tweet drafts from any quote", tag: "5 a month free" },
      { text: "Case study generator and weekly new-praise email", tag: "Pro" },
    ],
  },
];

const FREE_TOP = FREE_FEATURES.slice(0, 7);
const PRO_TOP = PRO_FEATURES.filter(
  (f) => !f.startsWith("URL import") && !f.startsWith("Deep AI")
).slice(0, 10);

const COMPARE = [TESTIMONI, COMPETITORS.senja, COMPETITORS["testimonial-to"]];
// Our own public wall (real posts from X), embedded live in the proof section.
const WALL_ID = "cmtedlomj0009w0btzyi3yweh";

// Re-read the wall quotes once an hour; the rest of the page is static.
export const revalidate = 3600;

export default async function LandingPage() {
  const quotes = await getWallQuotes(WALL_ID);
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData faqs={HOME_FAQ} />
      <PageEngagement surface="home" />
      <PageLoadPerf surface="home" anonymous />
      <HashScrollCleanup />

      <LaunchBar {...LAUNCH_BAR} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={28}
              height={28}
              className="rounded-full"
              priority
            />
            <span className="text-xl font-bold">Testimoni</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <TrackedLink cta="nav_pricing" surface="home_nav" href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </TrackedLink>
            <TrackedLink cta="nav_tools" surface="home_nav" href="/tools" className="text-sm text-muted-foreground hover:text-foreground">
              Free tools
            </TrackedLink>
            <TrackedLink cta="nav_live_demo" surface="home_nav" href="/demo" className="text-sm text-muted-foreground hover:text-foreground">
              Live demo
            </TrackedLink>
            <TrackedLink cta="nav_sample_wall" surface="home_nav" href="/w/demo" className="text-sm text-muted-foreground hover:text-foreground">
              Sample wall
            </TrackedLink>
            <PublicNavAuth />
          </nav>
          <PublicNavAuthMobile />
        </div>
      </header>

      <main className="flex-1">
        {/* 1 — Hero: the outcome first, the picture of it beside it */}
        <section className="relative overflow-hidden bg-gradient-to-b from-violet-100/70 via-violet-50/40 to-background">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-300/30 via-fuchsia-200/30 to-violet-300/30 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:gap-10 md:pb-24 md:pt-16">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-600/25 bg-white/80 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm">
                <Star className="h-3 w-3 fill-current" /> Free to start · No credit card · Live in 30 seconds
              </span>
              <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.6rem]">
                Your customers already love you.{" "}
                <span className="gradient-pan bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Put it on your website.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Collect testimonials with a link, or find what people already posted about you on X,
                LinkedIn and Reddit. Approve with a click, then show it anywhere with one line of
                code.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <TrackedLink
                  cta="hero_start_free"
                  surface="home"
                  href="/signup?src=home_hero"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-xl shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/40"
                >
                  Create my free wall <ArrowRight className="h-5 w-5" />
                </TrackedLink>
                <TrackedLink
                  cta="hero_see_live"
                  surface="home"
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-violet-200 bg-white px-6 py-3 text-base font-semibold text-violet-700 transition hover:border-primary hover:bg-violet-50"
                >
                  <Play className="h-4 w-4 fill-current" /> See it live, 30 seconds
                </TrackedLink>
              </div>
              <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <li className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free for 15 testimonials
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Works on Webflow, Framer, WordPress, Shopify
                </li>
              </ul>

              {/* On phones the picture of the outcome comes right after the buttons. */}
              <div className="mt-10 md:hidden">
                <HeroWall quotes={quotes} />
              </div>

              <div className="mt-8 max-w-xl rounded-2xl border border-violet-200/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold">
                  Not sure what people say about you?
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Paste your website. In about 20 seconds we show the real posts we find, free, no signup.
                </p>
                <div className="mt-3">
                  <FindProofForm placement="hero" size="md" />
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <HeroWall quotes={quotes} />
            </div>
          </div>
        </section>

        {/* 2 — Where we look */}
        <section className="border-y bg-muted/30 py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              We look where your customers talk
            </p>
            <ul className="flex flex-wrap justify-center gap-2">
              {SOURCES.map((s) => (
                <li
                  key={s}
                  className="rounded-full border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground/80"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7 — Proof: our own wall, running live with the embed above */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Loved by founders</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Real posts from real people
              </h2>
              <p className="mt-3 text-muted-foreground">
                This is our own wall, embedded on this page with one line of code. Each quote came
                from a post on X and keeps its link.
              </p>
            </div>
            <div className="relative mt-10 overflow-hidden rounded-2xl border bg-card p-3 shadow-sm sm:p-5">
              <div className="max-h-[640px] overflow-hidden">
                <LiveWall widgetId={WALL_ID} />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="mt-5 text-center">
              <TrackedLink
                cta="proof_open_wall"
                surface="home"
                href={`/w/${WALL_ID}?showcase=1`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                See the full wall <ExternalLink className="h-3.5 w-3.5" />
              </TrackedLink>
            </div>
          </div>
        </section>

        {/* 3 — Three ways to get testimonials */}
        <section id="how" className="scroll-mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Three ways to get customer testimonials
              </h2>
              <p className="mt-3 text-muted-foreground">
                Use one or all three. Then approve each testimonial in one click and show it on a
                hosted Wall of Love or with one line of code.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {WAYS.map(({ Icon, title, body, points, cta, href }, i) => (
                <FadeIn key={title} delay={i * 80}>
                  <div className="flex h-full flex-col rounded-2xl border bg-card p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                    <ul className="mt-4 flex-1 space-y-2 text-sm">
                      {points.map((p) => (
                        <li key={p} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                    <TrackedLink
                      cta={`ways_${i}`}
                      surface="home"
                      href={href}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      {cta} <ArrowRight className="h-4 w-4" />
                    </TrackedLink>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — Add one yourself (live demos) */}
        <section id="try" className="scroll-mt-20 border-y bg-gradient-to-br from-violet-50/60 via-background to-primary/[0.03] py-16 md:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Try it now</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Spotted one yourself? Add it in seconds.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Paste a link to a post, drop a screenshot of a DM or review, or pull in an app
                store review. These demos run live with no signup.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  "Tweets, LinkedIn posts, Reddit comments and any public URL",
                  "Screenshots of DMs, emails and reviews, read by AI",
                  "App Store and Google Play reviews",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <HeroDualDemo hide={["website"]} />
          </div>
        </section>

        {/* 6 — Show it anywhere */}
        <section className="border-y bg-muted/30 py-16 md:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Show it anywhere</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                One line of code. Or just share a link.
              </h2>
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  "A hosted Wall of Love page for your bio, emails and proposals",
                  "Grid, masonry, carousel, list and marquee layouts",
                  "Works on Framer, Webflow, WordPress, Shopify, Bubble and plain HTML",
                  "Styles stay isolated, so it never clashes with your site",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <TrackedLink
                  cta="show_sample_wall"
                  surface="home"
                  href="/w/demo"
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                >
                  See a sample wall <ExternalLink className="h-3.5 w-3.5" />
                </TrackedLink>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-slate-950 shadow-xl">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="ml-2 text-xs text-white/50">index.html</span>
              </div>
              <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed text-slate-200">
                <code>
                  <span className="text-slate-500">{"<!-- paste where the wall should appear -->"}</span>
                  {"\n"}
                  <span className="text-sky-300">{"<script"}</span>{" "}
                  <span className="text-violet-300">src</span>=
                  <span className="text-emerald-300">{'"https://testimoni.io/embed/widget.js"'}</span>
                  {"\n        "}
                  <span className="text-violet-300">data-widget-id</span>=
                  <span className="text-emerald-300">{'"YOUR_WIDGET_ID"'}</span>{" "}
                  <span className="text-violet-300">async</span>
                  <span className="text-sky-300">{"></script>"}</span>
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* 8 — Compare */}
        <section className="border-y bg-muted/30 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Honest comparison</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                How Testimoni compares
              </h2>
              <p className="mt-3 text-muted-foreground">
                Senja and Testimonial.to are mature tools. Here is where each one starts.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {COMPARE.map((t) => {
                const mine = t.slug === "testimoni";
                return (
                  <div
                    key={t.slug}
                    className={`flex flex-col rounded-2xl border bg-card p-6 ${
                      mine ? "border-2 border-primary shadow-lg shadow-primary/10" : ""
                    }`}
                  >
                    {mine && (
                      <span className="mb-2 w-fit rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        You are here
                      </span>
                    )}
                    <h3 className="text-lg font-semibold">{t.name}</h3>
                    <p className="mt-2 text-3xl font-bold">
                      ${t.firstPaidUsd}
                      <span className="text-sm font-normal text-muted-foreground">/mo to start</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{t.firstPaidLabel}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Free plan
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-foreground/80">
                      {(t.freeItems ?? t.freePlan.split(", ")).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
              Our free plan now holds 15 testimonials: level with Senja, and ahead of Testimonial.to&rsquo;s
              10 text plus 2 video. Where we go further is everything around the count: scanning for
              praise, AI screenshot extraction, an Ask My Wall chatbot, Wall Score, tweet drafts and
              free tools.
            </p>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Prices and free plans read from each tool&rsquo;s own pricing page on {FACTS_VERIFIED_ON}.{" "}
              <Link href="/vs/senja" className="underline underline-offset-2 hover:text-foreground">vs Senja</Link>
              {" · "}
              <Link href="/vs/testimonial-to" className="underline underline-offset-2 hover:text-foreground">vs Testimonial.to</Link>
              {" · "}
              <Link href="/blog/best-testimonial-tools" className="underline underline-offset-2 hover:text-foreground">All tools compared</Link>
            </p>
          </div>
        </section>

        {/* 9 — Pricing */}
        <section id="pricing" className="scroll-mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Start free. One simple plan when you grow.
              </h2>
            </div>
            <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
              <div className="flex flex-col rounded-2xl border bg-card p-6">
                <h3 className="text-lg font-semibold">Free</h3>
                <p className="mt-2 text-4xl font-bold"><FreePrice suffix="" /></p>
                <p className="text-sm text-muted-foreground">Free forever</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {FREE_TOP.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6"><PricingCta plan="free" /></div>
              </div>
              <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-xl shadow-primary/10">
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
                <h3 className="text-lg font-semibold">Pro</h3>
                <p className="mt-2 text-4xl font-bold"><ProPrice /></p>
                <p className="text-sm text-muted-foreground">Flat price, no tiers</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {PRO_TOP.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6"><PricingCta plan="pro" /></div>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/pricing" className="font-semibold text-primary hover:underline">
                See the full plan comparison
              </Link>
            </p>
          </div>
        </section>

        {/* 5 — Everything in one place */}
        <section id="features" className="scroll-mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Features</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Everything you need to collect, manage and show testimonials
              </h2>
              <p className="mt-3 text-muted-foreground">
                And tools for the part most testimonial tools skip: finding praise that already
                exists and putting it to work.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURE_GROUPS.map(({ Icon, title, note, items }, i) => {
                const extra = title === "Beyond collecting";
                return (
                  <FadeIn key={title} delay={i * 60}>
                    <div
                      className={`h-full rounded-2xl border bg-card p-6 ${
                        extra ? "border-2 border-primary shadow-lg shadow-primary/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </span>
                        <div>
                          <h3 className="font-semibold">{title}</h3>
                          {note && <p className="text-xs text-muted-foreground">{note}</p>}
                        </div>
                      </div>
                      <ul className="mt-5 space-y-3 text-sm">
                        {items.map((it) => (
                          <li key={it.text} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span className="min-w-0 break-words">
                              {it.text}
                              {it.tag && (
                                <span className="mt-1 block w-fit max-w-full rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                  {it.tag}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </section>

        {/* 10 — FAQ */}
        <section className="border-t bg-muted/30 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
              Questions, answered
            </h2>
            <div className="mt-8 divide-y rounded-2xl border bg-card">
              {HOME_FAQ.map((f) => (
                <details key={f.question} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {f.question}
                    <span className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 11 — Customer Voice: free, no subscription */}
        <section className="py-14">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border bg-gradient-to-br from-amber-50/60 via-background to-primary/[0.04] p-6 md:flex-row md:items-center md:p-8">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  Customer Voice · No subscription
                </p>
                <h2 className="mt-2 text-xl font-bold md:text-2xl">
                  Curious what customers say about you, good and bad?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get a free summary of praise, complaints and feature requests from X, Reddit and
                  LinkedIn. A full report is a one-time purchase from $9.
                </p>
              </div>
              <TrackedLink
                cta="customer_voice_band"
                surface="home"
                href="/tools/customer-voice"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-primary bg-background px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                Scan my site, free <ArrowRight className="h-4 w-4" />
              </TrackedLink>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              More free tools:{" "}
              <Link href="/tools/screenshot-to-testimonial" className="underline underline-offset-2 hover:text-foreground">screenshot to testimonial</Link>
              {", "}
              <Link href="/tools/praise-tweet-finder" className="underline underline-offset-2 hover:text-foreground">praise tweet finder</Link>
              {", "}
              <Link href="/tools" className="underline underline-offset-2 hover:text-foreground">all tools</Link>
            </p>
          </div>
        </section>

        {/* 12 — Final call to action */}
        <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 py-16 text-white md:py-20">
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Your wall of love is 30 seconds away.
            </h2>
            <p className="mt-3 text-white/85">
              Free for 15 testimonials. No credit card. Put real customer praise on your site today.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <TrackedLink
                cta="final_start_free"
                surface="home"
                href="/signup?src=home_final"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-violet-700 shadow-xl transition hover:-translate-y-0.5"
              >
                Create my free wall <ArrowRight className="h-5 w-5" />
              </TrackedLink>
              <TrackedLink
                cta="final_find_praise"
                surface="home"
                href="/tools/find-my-proof"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Or see who&rsquo;s praising you
              </TrackedLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <StickyMobileCta source="home" />
      <ExitIntent
        surface="home"
        headline="Before you go: see what we find for your site."
        body="Paste your website. It takes about a minute, it is free, and you do not need an account."
        ctaLabel="Find my praise"
        ctaHref="/tools/find-my-proof"
      />

      {/* Ask My Wall chatbot, loaded after first paint so it never blocks rendering. */}
      <Script
        src="/embed/ask.js"
        data-workspace={process.env.NEXT_PUBLIC_ASK_MY_WALL_HOME_SLUG ?? "founder"}
        strategy="lazyOnload"
      />
    </div>
  );
}
