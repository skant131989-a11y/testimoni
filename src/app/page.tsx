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
} from "lucide-react";
import { PublicNavAuth, PublicNavAuthMobile } from "@/components/layout/public-nav-auth";
import { ProPriceDual, FreePrice, FoundingBadge, FoundingExplainer } from "@/components/pricing/price-display";
import { AnimatedDemo } from "@/components/animated-demo";
import { StructuredData } from "@/components/seo/structured-data";
import { InlineSignup } from "@/components/inline-signup";
import { HeroEmailCta } from "@/components/hero-email-cta";
import { StickyMobileCta } from "@/components/sticky-mobile-cta";
import { TrackedLink } from "@/components/tracked-link";
import { TweetPreviewDemo } from "@/components/tweet-preview-demo";
import { PageEngagement } from "@/components/page-engagement";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData />
      <PageEngagement surface="home" />
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
            <TrackedLink cta="nav_features" surface="home_nav" href="/features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
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
      <section className="mx-auto max-w-7xl px-4 py-10 text-center md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-sm">
            <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
            Paste a tweet · Live in 30s
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Customer quotes{" "}
            <span className="text-primary">on your site today.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Paste a tweet, share a form, or drop a QR. Approve once —
            embed a wall on your site or share our free hosted URL.
            No credit card.
          </p>
          <HeroEmailCta source="home_hero" />
          {/* White-glove offer — the honest advantage.
              Founder-led setup replaces the anonymous "trusted by"
              tagline that had no names behind it. */}
          <p className="mt-4 text-sm text-muted-foreground">
            Want it live this week?{" "}
            <a
              href="mailto:hello@testimoni.io?subject=Set%20up%20my%20widget"
              className="font-semibold text-primary hover:underline"
            >
              Email me — I&apos;ll set it up with you.
            </a>
          </p>
          {/* Trust + scope chips — three small pills replace the old
              single-line tertiary text. Each claim now has its own
              visual anchor so scanners catch "Free plan", "No card",
              and "form/QR/link intake" without reading a full
              sentence. Still lower priority than the CTAs above. */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Free forever
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              No credit card
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Live in ~30s
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            <TrackedLink cta="hero_wall_demo" surface="home" href="/w/demo" className="font-medium text-primary hover:underline">
              or see a live wall →
            </TrackedLink>
          </p>
        </div>
      </section>

      {/* Ask → Collect → Publish strip. Answers the #1 unspoken question
          from cold traffic — "do the testimonials live on your site or
          mine?" — before it becomes a bounce. Sits above "How it works"
          which goes deeper on the two intake paths. */}
      <section className="border-y bg-primary/[0.03] py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                num: "1",
                title: "Ask",
                body: "Send one link — via email, WhatsApp, DM, QR code, or an embed on your site. Or paste a customer's tweet directly.",
              },
              {
                num: "2",
                title: "Collect",
                body: "Text, ratings, and video (1 free on every plan) all land in one inbox. Approve with one click.",
              },
              {
                num: "3",
                title: "Publish",
                body: "One line of JavaScript embeds the wall on your site — or share our free hosted Wall of Love URL anywhere.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.num}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free tools strip — surfaces /tools/* from the home page.
          Slim, single-row so it doesn't compete with the Ask/Collect/
          Publish or the paste-a-tweet demo below. */}
      <section className="border-b bg-background py-6">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Also free
              </span>
              — 3 tools no signup required:
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
            </div>
          </div>
        </div>
      </section>

      {/* How it works — two parallel intake paths meeting at the same
          wall. Placed after the hero (which sells the paste-a-tweet
          promise) and before the interactive demo. Shows tweet-import
          AND form-collection as equal citizens so users without praise
          tweets don't bounce thinking "not for me". */}
      <section className="border-y bg-background py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              How it works
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Two ways to fill your wall — pick whichever you have
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Path A — paste-a-tweet (the wedge) */}
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-6">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                Path A · Fastest
              </div>
              <h3 className="text-lg font-semibold">Have praise tweets or LinkedIn posts?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Turn any public post into a testimonial in 30 seconds — no screenshots.
              </p>
              <ol className="mt-5 space-y-3">
                <PathStep number={1}>Find a public X or LinkedIn post praising your work</PathStep>
                <PathStep number={2}>Paste the URL — we pull author, photo, and text</PathStep>
                <PathStep number={3}>Approve — it&apos;s live on your wall</PathStep>
              </ol>
            </div>

            {/* Path B — collect via form */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Path B · For fresh ones
              </div>
              <h3 className="text-lg font-semibold">Want to collect new testimonials?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Share a form link with your customers — text, star ratings, and video (1 free, unlimited on Pro).
              </p>
              <ol className="mt-5 space-y-3">
                <PathStep number={1}>Share your collection form URL, QR code, or embed</PathStep>
                <PathStep number={2}>Customers submit — lands in your inbox for review</PathStep>
                <PathStep number={3}>Approve — it&apos;s live on your wall</PathStep>
              </ol>
            </div>
          </div>

          {/* Convergence line — both paths end at the same wall */}
          <div className="mt-6 flex items-center justify-center">
            <div className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              ↓ Both end at your Wall of Love — one URL, one embed, one library ↓
            </div>
          </div>
        </div>
      </section>

      {/* Tweet-import callout — visual proof of the hero's "paste a tweet"
          promise. Placed right after the hero (before the animated demo,
          which shows the form path) so the reader gets the promised
          paste-a-tweet demo first. */}
      <section className="border-y bg-gradient-to-br from-blue-50/40 via-background to-purple-50/40 py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
                <Zap className="h-3 w-3" />
                Instant library
              </div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Have a tweet? Paste it right here.
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Paste any public{" "}
                <span className="font-semibold text-foreground">X (Twitter)</span>{" "}
                or{" "}
                <span className="font-semibold text-foreground">LinkedIn</span>{" "}
                post URL — we pull the author and text right now, no signup
                needed. When you like what you see, save it to your library
                with one click.
              </p>
            </div>

            {/* Live paste-a-URL demo — anonymous, hits /api/tweet-preview,
                swaps the static Sarah card for the user's imported
                testimonial. The whole point of this section. */}
            <div className="w-full max-w-sm md:min-w-[380px]">
              <TweetPreviewDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Animated demo — shows the form → approve → widget path so both
          intake flows get one visual each (tweet-import above, form here). */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-muted-foreground">
            That was paste-a-tweet. Here&apos;s the form path — click through,
            it&apos;s live.
          </p>
          <AnimatedDemo />
        </div>
      </section>

      {/* Video testimonials pitch — sits between the two demos and
          the wall preview so the reader's mental model expands:
          text works, forms work, and if you want richer proof
          there's video. Kept compact so it doesn't dominate. */}
      <section className="border-y bg-gradient-to-br from-primary/5 via-background to-background py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                1 free · Video
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Prefer video over text?
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Upload short customer videos or record them from your
                phone. Video testimonials convert around 2× better than
                text alone — nothing beats seeing a real customer say
                real words.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>MP4 or MOV up to 50MB, played in a modal on your wall</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Works the same on the hosted wall and the embed widget</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>1 free video on every plan — Pro unlocks unlimited</span>
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <TrackedLink cta="video_section_pricing" surface="home" href="/pricing">
                  <Button variant="outline">
                    See pricing <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </TrackedLink>
              </div>
            </div>

            {/* Mockup video testimonial card — thumbnail placeholder
                with a play overlay + customer meta below. No real
                video (we don't want a 5MB payload on the landing
                page); the visual conveys the concept. */}
            <div className="mx-auto w-full max-w-md">
              <div className="rounded-2xl border bg-background p-4 shadow-sm">
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Video
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <Play className="ml-0.5 h-6 w-6 fill-black text-black" />
                  </div>
                </div>
                <div className="mt-4 flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    M
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Marcus Johnson</p>
                    <p className="text-xs text-muted-foreground">
                      Course creator · 45s video
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Sample video testimonial card
              </p>
            </div>
          </div>
        </div>
      </section>

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
              {
                icon: Play,
                title: "Video testimonials",
                description:
                  "1 free video on every plan — upload MP4 or MOV up to 50MB. Plays inline on your hosted wall + embedded widget. Pro unlocks unlimited. Video testimonials convert ~2× better than text.",
              },
              {
                icon: MonitorSmartphone,
                title: "Public Wall of Love URL",
                description:
                  "Every workspace gets a shareable wall URL — testimoni.io/w/… — public, no signup needed. Drop it in bios, DMs, or a QR code on your packaging.",
              },
              {
                icon: Share2,
                title: "Ready-to-share templates",
                description:
                  "Copy-paste WhatsApp, DM, and email asks for customers, plus a downloadable QR code for packaging or receipts. Filling your wall stops being a &ldquo;what do I even say?&rdquo; problem.",
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

          <p className="mt-10 text-center text-sm">
            <TrackedLink
              cta="features_grid_see_all"
              surface="home"
              href="/features"
              className="font-medium text-primary hover:underline"
            >
              See all features and details →
            </TrackedLink>
          </p>
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
                $9 Pro · You email, I ship
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Half of Senja, one-fifth of Testimonial.to. Native ₹499 in
                India — no forex middleman. Every support email lands with
                me directly and ships as code within days, not quarters.
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
              <p className="mt-2 text-3xl font-bold"><FreePrice suffix="" /></p>
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
              <div className="mb-2">
                <FoundingBadge />
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-2 text-3xl font-bold"><ProPriceDual /></p>
              <FoundingExplainer className="mt-2" />
              <p className="mt-3 text-sm text-muted-foreground">Everything unlimited</p>
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
 * Single step within a "How it works" path column. Numbered circle
 * + body copy in a tight row. Used by both Path A (paste-a-tweet)
 * and Path B (form collection) so both paths render the same shape.
 */
function PathStep({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
        {number}
      </div>
      <p className="text-sm leading-relaxed text-foreground">{children}</p>
    </li>
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
