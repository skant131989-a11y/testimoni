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
  Search,
  Link2,
  Share2,
  Play,
  Gauge,
  Send,
  Sparkles,
} from "lucide-react";
import { PublicNavAuth, PublicNavAuthMobile } from "@/components/layout/public-nav-auth";
import { ProPrice, ProPriceDual, ProAiPrice, FreePrice, FoundingBadge, FoundingExplainer } from "@/components/pricing/price-display";
// AnimatedDemo used to render on this page; moved to /features.
// PathStep used to render on this page; moved to /features.
import { StructuredData } from "@/components/seo/structured-data";
import { InlineSignup } from "@/components/inline-signup";
import { HeroDualDemo } from "@/components/hero-dual-demo";
import { FREE_FEATURES, PRO_FEATURES } from "@/lib/plan-features";
import { PRO_AI_PUBLIC } from "@/lib/feature-flags";
// PRO_AI_FEATURES no longer exists — the tier was collapsed back
// into Pro. Keep an empty tuple so the (currently disabled)
// PRO_AI_PUBLIC card renders without a compile error if the flag
// is ever re-enabled without also restoring the array.
const PRO_AI_FEATURES: readonly string[] = [];
import { StickyMobileCta } from "@/components/sticky-mobile-cta";
import { TrackedLink } from "@/components/tracked-link";
import { HeroScrollLink } from "@/components/hero-scroll-link";
import { PageEngagement } from "@/components/page-engagement";
import { PageLoadPerf } from "@/components/page-load-perf";
import { LovedByFoundersStrip } from "@/components/loved-by-founders-strip";
import { LiveSignupTicker } from "@/components/live-signup-ticker";
import { LaunchBar } from "@/components/launch-bar";
import { PricingCta } from "@/components/pricing/pricing-cta";
import { HashScrollCleanup } from "@/components/hash-scroll-cleanup";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData />
      <PageEngagement surface="home" />
      <PageLoadPerf surface="home" anonymous />
      <HashScrollCleanup />
      {/* Launch-week bar. Sits above the sticky nav so it moves out
          of view on scroll (nav stays); dismissable + persists via
          localStorage. Bump the `id` when this message changes. */}
      <LaunchBar
        id="ask-my-wall-2026-09"
        href="#new-ai-features"
        message="Ask My Wall is live — an AI chatbot that only quotes real customers."
        cta="See it"
      />
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
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
            <TrackedLink cta="nav_demo" surface="home_nav" href="/demo" className="text-sm text-muted-foreground hover:text-foreground">
              Live Demo
            </TrackedLink>
            <TrackedLink cta="nav_tools" surface="home_nav" href="/tools" className="text-sm text-muted-foreground hover:text-foreground">
              Free Tools
            </TrackedLink>
            <TrackedLink cta="nav_pricing" surface="home_nav" href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </TrackedLink>
            {/* Auth buttons — client component with anonymous default,
                swaps to Dashboard after mount if the visitor is
                logged in. Keeps this whole page statically renderable
                so it can be served from the CDN edge. */}
            <PublicNavAuth />
          </nav>
          <PublicNavAuthMobile />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          {/* Left column — sharp promise, quiet secondary CTA, no
              competing noise. Deliberate hierarchy:
                1. Badge  → tone
                2. H1     → the promise, in the same voice as the badge
                3. Sub    → what happens
                4. Trust  → free / no card / 30s
                5. Button → soft "Sign up free" for pre-sold visitors
                6. Link   → "See a live wall" for demo-averse ones
              The interactive paste demo lives in the right column
              and IS the primary action for skeptics. */}
          <div>
            <div className="mb-3">
              <LiveSignupTicker />
            </div>
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Now free — App Store, Play Store, Shopify + 5 more
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Any praise becomes a{" "}
              <span className="bg-gradient-to-r from-purple-600 via-primary to-fuchsia-600 bg-clip-text text-transparent">
                Wall of Love.
              </span>{" "}
              Now the wall talks back.
            </h1>
            {/* Punchy "how fast + easiest path" line right under the
                brand headline. Reinstates the 30-second promise and
                the "paste a tweet" hook the old hero led with —
                these were our biggest conversion drivers pre-brand
                pivot, so they belong in the fold even if the H1 is
                brand-first now. */}
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary md:text-base">
              <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Paste a tweet → live wall in 30 seconds. No signup to preview.
            </p>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Paste a tweet, drop a screenshot, or import from App
              Store, Play, Chrome, Product Hunt, Shopify. Testimoni
              turns every kind of praise into a Wall of Love — with
              an AI chatbot that answers visitors using real customer
              quotes, cited by name.
            </p>

            {/* Trust caption sits close to the sub — reads as
                supporting proof, not a competing chip row. */}
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-primary/60" />
                Free forever
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-primary/60" />
                No credit card
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-primary/60" />
                Live in ~30s
              </span>
            </div>

            {/* Softened CTA — default size, no giant py-6, plain
                "Sign up free" label. Catches pre-sold visitors
                without competing with the demo card on the right. */}
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <TrackedLink cta="hero_signup" surface="home_hero" href="/signup">
                <Button size="default" className="gap-2">
                  Sign up free <ArrowRight className="h-4 w-4" />
                </Button>
              </TrackedLink>
              <TrackedLink
                cta="hero_wall_demo"
                surface="home"
                href="/w/demo"
                className="font-medium text-muted-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:text-foreground hover:decoration-foreground"
              >
                See a live wall →
              </TrackedLink>
            </div>

            {/* Escape hatch for visitors whose customers don't tweet
                yet. Without this line the hero shouts "paste a tweet"
                so hard it hides the form path, and anyone without
                public praise bounces before scrolling. One quiet
                text link keeps the hero focused while signalling
                the alternative path exists. Uses HeroScrollLink so
                the hash gets cleaned up after scrolling — a plain
                <a href="#form-path"> would leave #form-path stuck in
                the URL, making the SECOND click a no-op. */}
            {/* Escape hatch for visitors without public praise —
                sends them to the /features "Two intake paths"
                section (which now hosts the form-path detail;
                it used to live on this page but moved during the
                home-simplification pass). */}
            <p className="mt-3 text-xs text-muted-foreground">
              No public praise yet?{" "}
              <TrackedLink
                cta="hero_form_path"
                surface="home_hero"
                href="/features#collect"
                className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              >
                Share a form instead →
              </TrackedLink>
            </p>
          </div>

          {/* Right column — interactive dual demo. Tab 1 is paste-a-
              tweet (proven, kept default). Tab 2 is the new
              screenshot-to-testimonial autoplay demo (zero API cost —
              pre-computed examples). Both feed the same signup CTA
              so the funnel doesn't fork. See <HeroDualDemo>. */}
          <div className="relative mx-auto w-full max-w-md">
            <HeroDualDemo />
          </div>
        </div>
      </section>

      {/* "Loved by founders" — hand-curated real testimonial strip.
          Extracted to <LovedByFoundersStrip /> so we drop the same
          social-proof surface on /pricing, /features, and /demo
          without duplicating the layout. */}
      <LovedByFoundersStrip />

      {/* Wall of Love preview — shows what a live wall actually looks like
          after all the collection + approval. Static grid, not interactive,
          links out to /w/demo for the full experience. Same testimonials as
          /w/demo so the click-through feels like "yes, exactly what I saw." */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border-2 border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              ✨ Example — this is what yours could look like
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Your Wall of Love in 30 seconds.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Every workspace gets a free hosted URL —{" "}
              <span className="font-medium text-foreground">testimoni.io/w/you</span> —
              plus a one-line embed for your site.
              The cards below are illustrative, not real customers.
            </p>
          </div>

          {/* 6-card wall preview — 3 cols on desktop, 2 on tablet, 1 on
              mobile. Same product-focused sample quotes as /w/demo. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                letter: "S",
                color: "bg-emerald-600",
                name: "Sarah Chen",
                title: "SaaS founder",
                quote:
                  "We pasted 8 customer tweets and the homepage finally had proof.",
              },
              {
                letter: "M",
                color: "bg-blue-600",
                name: "Marcus Johnson",
                title: "Course creator",
                quote:
                  "Students fill the form after the cohort. Widget is on the sales page the same day.",
              },
              {
                letter: "P",
                color: "bg-orange-600",
                name: "Priya Menon",
                title: "Shopify / D2C",
                quote:
                  "Post-delivery form → 5-star quotes on the product page. No app store install.",
              },
              {
                letter: "J",
                color: "bg-rose-600",
                name: "Jamal Wilson",
                title: "Indie hacker",
                quote:
                  "Free plan was enough to replace the Notion doc of screenshots.",
              },
              {
                letter: "E",
                color: "bg-cyan-600",
                name: "Emily Rodriguez",
                title: "Agency owner",
                quote:
                  "One workspace, different widgets per client site.",
              },
              {
                letter: "A",
                color: "bg-purple-600",
                name: "Aditi Rao",
                title: "Freelance designer",
                quote:
                  "One-line embed dropped in Framer. Wall refreshes when I approve.",
              },
              {
                // 7th card — video variant, centered on row 3 col 2
                // via the render loop's grid classes so it doesn't
                // sit orphaned at the edge of a lonely last row.
                letter: "M",
                color: "bg-emerald-600",
                name: "Marcus Johnson",
                title: "Course creator · 45s video",
                quote:
                  "Recorded a 45-second review from my phone. Now it's the first thing customers see on my product page.",
                video: true,
              },
            ].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className={`flex flex-col rounded-xl border bg-background p-5 shadow-sm ${
                  t.video ? "sm:col-span-2 lg:col-span-1 lg:col-start-2" : ""
                }`}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                {/* Video variant — one card in the grid is a video
                    testimonial so passive scanners see what video
                    looks like on the wall without a dedicated CTA. */}
                {t.video && (
                  <div className="relative mt-3 flex aspect-video items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-slate-800 to-slate-900">
                    <div className="absolute right-2 top-2 rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                      Video
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md">
                      <Play className="ml-0.5 h-4 w-4 fill-black text-black" />
                    </div>
                  </div>
                )}
                <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${t.color}`}
                  >
                    {t.letter}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.title}
                      {t.video && " · Video"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm">
            <TrackedLink
              cta="wall_preview_see_live"
              surface="home"
              href="/w/demo"
              className="font-medium text-primary hover:underline"
            >
              See a live Wall of Love →
            </TrackedLink>
          </p>
        </div>
      </section>

      {/* Ask → Collect → Publish 3-step strip. Restored to home
          per Neha's ask — visitors need this "here's the whole
          flow in 3 beats" moment right after they see the wall.
          Compact so it doesn't compete with the AI features band
          that follows. Full narrative lives on /features. */}
      <section className="border-t py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              The whole flow
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Ask → Collect → Publish
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                num: "1",
                title: "Ask",
                icon: "📨",
                body:
                  "Share your form via email, WhatsApp, DM, QR code, or an embed on your site. Or skip the form entirely and paste a customer's tweet directly.",
              },
              {
                num: "2",
                title: "Collect",
                icon: "📥",
                body:
                  "Text, star ratings, video (1 free on every plan) — plus praise scraped from App Store, Play, Chrome, Product Hunt, Shopify — all land in one inbox.",
              },
              {
                num: "3",
                title: "Publish",
                icon: "🚀",
                body:
                  "One line of JavaScript embeds the wall on your site. Or share your free hosted Wall of Love URL anywhere — bios, emails, QR codes.",
              },
            ].map((step) => (
              <div key={step.num} className="rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.num}
                  </div>
                  <div className="text-2xl">{step.icon}</div>
                </div>
                <p className="mt-4 text-base font-semibold">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Pro AI features band — sits right before pricing so
          visitors see the upsell hook in the moment they're deciding
          "free or Pro?". Compact by design — three tiles, one CTA.
          The visual story: Score / Amplify / Answer — the three
          verbs that describe what Pro does with the wall you've
          already collected. */}
      <section id="new-ai-features" className="border-t bg-gradient-to-br from-primary/[0.04] via-background to-primary/[0.02] py-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              <Sparkles className="h-3 w-3" />
              New · Included in Pro
            </div>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Your wall of love, but smarter.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Three AI features that turn testimonials into insight, tweets,
              and answers — grounded on the real customers you already have.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {/* Wall Score */}
            <Link
              href="/signup?tool=wall-score"
              className="group flex flex-col rounded-2xl border bg-card p-6 transition hover:border-primary hover:shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Gauge className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Wall Score
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Audit your wall 0–100
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                6 dimensions — volume, diversity, video, recency, verification,
                ratings. Trend graph + specific next actions per weakness.
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-700 group-hover:gap-2 transition-all">
                See how it works <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            {/* Tweet drafts */}
            <Link
              href="/signup?tool=tweet-drafts"
              className="group flex flex-col rounded-2xl border bg-card p-6 transition hover:border-primary hover:shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Send className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Tweet drafts
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Every quote → 3 tweets
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Quote, reaction, callout — three tweet-length drafts per
                testimonial. One click opens X or LinkedIn compose, pre-filled.
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-700 group-hover:gap-2 transition-all">
                See how it works <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            {/* Ask My Wall */}
            <Link
              href="/signup?tool=ask-my-wall"
              className="group flex flex-col rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-background p-6 transition hover:border-primary hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Ask My Wall
                  </span>
                </div>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                  Wow
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                AI chatbot, real quotes only
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Visitors ask questions on your site. Answers cite real
                customers by name — Rachel at HubSpot said 4 hours. Never
                invents.
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                See how it works <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <TrackedLink
              cta="new_features_band_cta"
              surface="home"
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              All three included in Pro · $9/mo
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
            <p className="text-xs text-muted-foreground">
              Free plan gets 1 Wall Score audit + 5 tweet drafts/mo. Ask My
              Wall is Pro-only.
            </p>
          </div>
        </div>
      </section>

      {/* Review-platforms band — announces the newly-Free auto-import
          from App Store / Play Store / Chrome Web Store / Product
          Hunt. Sits above the AI features so the story reads
          intake-first ("look at all the places we can pull praise
          from") before value-add ("and here's what Pro adds on
          top"). */}
      <section className="border-t bg-gradient-to-b from-background via-primary/[0.02] to-background py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              <Sparkles className="h-3 w-3" />
              Now free
            </div>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Auto-import from every review platform.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Paste an App Store, Play Store, Chrome Web Store, or Product
              Hunt URL. We pull the reviews, you approve, they land on your
              Wall of Love — all on the Free plan.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {[
              {
                name: "App Store",
                logoBg: "bg-blue-500",
                logoLetter: "A",
                tagline: "iOS + macOS reviews",
              },
              {
                name: "Play Store",
                logoBg: "bg-emerald-500",
                logoLetter: "P",
                tagline: "Android apps",
              },
              {
                name: "Chrome Web Store",
                logoBg: "bg-yellow-500",
                logoLetter: "C",
                tagline: "Extension reviews",
              },
              {
                name: "Product Hunt",
                logoBg: "bg-orange-500",
                logoLetter: "P",
                tagline: "Launch reviews",
              },
              {
                name: "Shopify",
                logoBg: "bg-lime-600",
                logoLetter: "S",
                tagline: "Shopify App Store",
              },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${p.logoBg} text-lg font-black text-white`}
                >
                  {p.logoLetter}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {p.tagline}
                  </p>
                </div>
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <TrackedLink
              cta="review_sources_band_cta"
              surface="home"
              href="/signup?src=review_sources_band"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Start free — no credit card
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
            <p className="text-xs text-muted-foreground">
              Free: manual import + 10-testimonial cap. Pro: auto-sync every
              24h + auto-approve + unlimited.
            </p>
          </div>
        </div>
      </section>

      {/* Free tools strip — moved down from just after paste-a-tweet
          to here (after all four product demos: paste-a-tweet, form
          path, video pitch, example wall). Reason: the tools compete
          with the main product story if surfaced too early; placing
          them after the visitor has SEEN what the product does frames
          them as a nice-to-have bonus rather than a distraction.
          Still above Features/Pricing so scanners find them. */}
      <section className="border-b bg-background py-6">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Also free
              </span>
              — 6 tools no signup required:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <TrackedLink
                cta="tools_strip_card"
                surface="home"
                href="/tools/testimonial-card"
                className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary/40 hover:bg-primary/5"
              >
                🖼️ Card generator
              </TrackedLink>
              <TrackedLink
                cta="tools_strip_finder"
                surface="home"
                href="/tools/praise-tweet-finder"
                className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary/40 hover:bg-primary/5"
              >
                🔎 Praise tweet finder
              </TrackedLink>
              <TrackedLink
                cta="tools_strip_writer"
                surface="home"
                href="/tools/testimonial-writer"
                className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary/40 hover:bg-primary/5"
              >
                ✍️ Testimonial writer
              </TrackedLink>
              <TrackedLink
                cta="tools_strip_ask"
                surface="home"
                href="/tools/ask-templates"
                className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary/40 hover:bg-primary/5"
              >
                💬 Ask templates
              </TrackedLink>
              <TrackedLink
                cta="tools_strip_linkedin"
                surface="home"
                href="/tools/linkedin-recommendation"
                className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary/40 hover:bg-primary/5"
              >
                💼 LinkedIn recommendation
              </TrackedLink>
              <TrackedLink
                cta="tools_strip_badge"
                surface="home"
                href="/tools/star-badge"
                className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary/40 hover:bg-primary/5"
              >
                ⭐ Star badge
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid and "Get started in 3 steps" both moved to
          /features so home stays focused. Feature grid was 100 lines
          of card-tile duplication of what /features already carries;
          the 3-step "how it works" section duplicated the earlier
          Ask/Collect/Publish strip. The compact "Everything inside
          Testimoni" band above the Wall of Love preview links visitors
          who want the depth. */}

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
            {/* Wedge — the ONE feature nobody else leads with. Kept
                first so the reader locks in the differentiator
                before the pricing/pos tiles below. */}
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
              <div className="text-3xl">📋</div>
              <h3 className="mt-3 text-lg font-bold">
                Paste a tweet, done in 30s
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                URL in, live testimonial out — no screenshots, no copy-paste.
                Senja and Testimonial.to make you build a form and email 20
                customers before you have anything to show.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
              <div className="text-3xl">🎥</div>
              <h3 className="mt-3 text-lg font-bold">
                Video on the free plan
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                1 free video testimonial per workspace, unlimited on Pro.
                Competitors gate video behind their $50+ plans — we
                include it in $0.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
              <div className="text-3xl">🌐</div>
              <h3 className="mt-3 text-lg font-bold">
                Free wall URL + share tools
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every workspace gets a public Wall of Love URL you can drop
                in your bio day one. Plus ready-to-send WhatsApp / DM / email
                templates and a QR code for packaging. All on Free.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
              <div className="text-3xl">💸</div>
              <h3 className="mt-3 text-lg font-bold">
                {/* Auto-detected currency — Indian visitors see
                    "₹499 Pro", everyone else sees "$9 Pro". Stops
                    the awkward mismatch where the title was hard-
                    coded USD but the body claimed native INR. */}
                <ProPrice suffix="" /> Pro · You email, I ship
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Half of Senja, one-fifth of Testimonial.to. Native
                pricing in USD or INR — no forex middleman. Every
                support email lands with me directly and ships as
                code within days, not quarters.
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


      {/* "See what's inside Testimoni" band — the last-chance
          deep-dive doorway right before pricing. High-intent
          visitors who scrolled this far but aren't ready to buy
          get one final path: chip-links into the /features deep
          dive to answer the "but does it do X?" objections that
          fire in the moment before a price commitment. When they
          return from /features, /features' own CTAs (signup,
          pricing) close the loop. */}
      <section className="border-y bg-primary/[0.03] py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Everything inside Testimoni
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                The full flow, every intake path, every layout, every AI feature.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <Link href="/features#how-it-works" className="rounded-full border bg-card px-3 py-1.5 font-medium hover:border-primary hover:text-primary">
                How it works
              </Link>
              <Link href="/features#collect" className="rounded-full border bg-card px-3 py-1.5 font-medium hover:border-primary hover:text-primary">
                Intake paths
              </Link>
              <Link href="/features#video" className="rounded-full border bg-card px-3 py-1.5 font-medium hover:border-primary hover:text-primary">
                Video
              </Link>
              <Link href="/features#features" className="rounded-full border bg-card px-3 py-1.5 font-medium hover:border-primary hover:text-primary">
                All features
              </Link>
              <TrackedLink cta="features_band_see_all" surface="home" href="/features" className="ml-1 inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                See all <ArrowRight className="h-3 w-3" />
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      {/* "Everything Testimoni does" — compact 6-card preview of
          the full feature grid on /features. Sits right below the
          doorway band so the visitor sees a taste before pricing:
          "here are 6 things the product does, and 20+ more if you
          click through." Doubles the depth signal without doubling
          the scroll. Per Neha's ask 2026-09-10. */}
      <section className="border-t py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Everything Testimoni does
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Six of the twenty. See the rest.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                emoji: "🐦",
                title: "Paste-a-tweet",
                body: "Turn any public X or LinkedIn URL into an approved testimonial in seconds.",
              },
              {
                emoji: "🧠",
                title: "Screenshot → testimonial (AI)",
                body: "Drop a screenshot of DMs, Slack, WhatsApp, App Store — Claude Vision extracts it.",
              },
              {
                emoji: "🏬",
                title: "Auto-import reviews",
                body: "App Store, Play, Chrome, Product Hunt, Shopify — free plan can connect + sync.",
              },
              {
                emoji: "🎬",
                title: "Video testimonials",
                body: "1 free video per plan, unlimited on Pro. Plays inline on your wall + embed.",
              },
              {
                emoji: "🎨",
                title: "5 layouts",
                body: "Grid, Masonry, Carousel, List, Marquee. Pick per widget.",
              },
              {
                emoji: "💬",
                title: "Ask My Wall chatbot",
                body: "Embed an AI chatbot that answers visitors using your real customers, cited by name.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-card p-5 transition hover:border-primary hover:shadow"
              >
                <div className="text-2xl">{f.emoji}</div>
                <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <TrackedLink
              cta="everything_grid_see_all"
              surface="home"
              href="/features#features"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              See all 20+ features → <ArrowRight className="h-3.5 w-3.5" />
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
          <div className={PRO_AI_PUBLIC ? "mt-12 mx-auto grid max-w-6xl gap-6 md:grid-cols-3" : "mt-12 mx-auto grid max-w-3xl gap-8 md:grid-cols-2"}>
            {/* Free */}
            <div className="rounded-lg border bg-card p-6 text-left">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-2 text-3xl font-bold"><FreePrice suffix="" /></p>
              <p className="text-sm text-muted-foreground">Forever free — try the viral loops</p>
              <ul className="mt-6 space-y-2.5">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {/* Account-aware CTA — Free card sends anon to /signup,
                  logged-in users to /dashboard. Shared with /pricing. */}
              <PricingCta plan="free" />
            </div>

            {/* Pro — utility tier */}
            <div className="relative rounded-lg border-2 border-primary bg-card p-6 text-left">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most Popular
              </div>
              <div className="mb-2">
                <FoundingBadge />
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-2 text-3xl font-bold"><ProPriceDual /></p>
              <FoundingExplainer className="mt-2" />
              <p className="mt-3 text-sm text-muted-foreground">Unlimited utility + one AI perk</p>
              <ul className="mt-6 space-y-2.5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {/* Account-aware CTA: anon → signup; Free → 1-click
                  Razorpay; Pro → manage subscription. Shared with the
                  /pricing page so the two surfaces stay in sync. */}
              <PricingCta plan="pro" />
            </div>

            {/* Pro AI — intelligence tier. Feature-flagged off until
                the Razorpay + Stripe products are created; the pricing
                scaffold (schema, constants, hook) is live so nothing
                else changes when we flip PRO_AI_PUBLIC. */}
            {PRO_AI_PUBLIC && (
            <div className="relative rounded-lg border-2 border-fuchsia-500 bg-gradient-to-br from-fuchsia-50 via-white to-purple-50 p-6 text-left">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-3 py-1 text-xs font-medium text-white">
                🧠 AI Intelligence
              </div>
              <h3 className="text-lg font-semibold">Pro AI</h3>
              <p className="mt-2 text-3xl font-bold"><ProAiPrice suffix="" /></p>
              <p className="mt-3 text-sm text-muted-foreground">Everything + the intelligence layer</p>
              <ul className="mt-6 space-y-2.5">
                {PRO_AI_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <TrackedLink cta="pricing_preview_pro_ai" surface="home" href="/signup" className="mt-6 block">
                <Button className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:from-fuchsia-700 hover:to-purple-700">
                  Try Free — Upgrade to Pro AI
                </Button>
              </TrackedLink>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* Built-for strip — surfaces the /for/[niche] landing pages
          so first-time visitors know an industry-tailored page exists
          for them. Slim, single-row, near the bottom of the marketing
          flow so it doesn't compete with the hero. */}
      <section className="border-y bg-primary/[0.03] py-10">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Built for
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              { slug: "saas", label: "SaaS founders" },
              { slug: "course-creators", label: "Course creators" },
              { slug: "shopify", label: "Shopify / D2C" },
              { slug: "freelancers", label: "Freelancers" },
              { slug: "agencies", label: "Agencies" },
              { slug: "photographers", label: "Photographers" },
              { slug: "real-estate-agents", label: "Real estate agents" },
              { slug: "wedding-vendors", label: "Wedding vendors" },
            ].map((n) => (
              <TrackedLink
                key={n.slug}
                cta={`home_builtfor_${n.slug}`}
                surface="home"
                href={`/for/${n.slug}`}
                className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary/40 hover:bg-primary/5"
              >
                {n.label}
              </TrackedLink>
            ))}
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
                Get set up in 30 seconds. Free forever plan. No credit card required.
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
      <footer className="border-t">
        {/* By industry — surfaces the /for/[niche] pages so someone
            reading the footer sees they can find an industry-specific
            landing page. Bigger than the existing bottom nav, sits
            above it as its own strip. */}
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            By industry
          </p>
          <div className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2 md:grid-cols-4">
            <Link href="/for/saas" className="text-muted-foreground hover:text-foreground">SaaS founders</Link>
            <Link href="/for/course-creators" className="text-muted-foreground hover:text-foreground">Course creators</Link>
            <Link href="/for/shopify" className="text-muted-foreground hover:text-foreground">Shopify / D2C</Link>
            <Link href="/for/freelancers" className="text-muted-foreground hover:text-foreground">Freelancers</Link>
            <Link href="/for/agencies" className="text-muted-foreground hover:text-foreground">Agencies</Link>
            <Link href="/for/photographers" className="text-muted-foreground hover:text-foreground">Photographers</Link>
            <Link href="/for/real-estate-agents" className="text-muted-foreground hover:text-foreground">Real estate agents</Link>
            <Link href="/for/wedding-vendors" className="text-muted-foreground hover:text-foreground">Wedding vendors</Link>
          </div>
        </div>
        <div className="border-t py-8">
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
            <Link href="/tools" className="text-muted-foreground hover:text-foreground">Free Tools</Link>
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
            &copy; 2026 Testimoni. All rights reserved.
          </p>
          </div>
        </div>
      </footer>
      <StickyMobileCta source="home" />
    </div>
  );
}

/**
 * Single step in the "How it works" strip. Numbered circle + icon +
 * title + body. Extracted so the three-column grid stays flat and
 * easy to scan in the JSX above.
 *
 * NOTE: no longer used after the two-path refactor, but kept in case
 * we want to reintroduce a compact strip elsewhere.
 */
function HowItWorksStep({
  number,
  icon: Icon,
  title,
  body,
}: {
  number: number;
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {number}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}
