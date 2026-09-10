import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Send,
  Inbox,
  LayoutGrid,
  Code2,
  Video,
  Zap,
  Palette,
  ShieldCheck,
  Globe,
  Twitter,
  Heart,
  MessageSquare,
  Layout,
  Code,
  Shield,
  Star,
  MonitorSmartphone,
  Share2,
  Play,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { InlineSignup } from "@/components/inline-signup";
import { TrackedLink } from "@/components/tracked-link";
import { LovedByFoundersStrip } from "@/components/loved-by-founders-strip";
import { AnimatedDemo } from "@/components/animated-demo";

export const metadata: Metadata = {
  title: "Features — Testimoni · Paste-a-tweet, video, AI, and 25+ more",
  description:
    "Every intake path (paste-a-tweet, screenshot AI, form, video, App Store), every layout, every AI feature — plus the 3-step flow that ties them together. The full Testimoni deep dive.",
  alternates: { canonical: "/features" },
};

// The two headline wedges — paste-a-tweet + hosted wall — get a dedicated
// hero row above the generic feature grid.
const headlineWedges = [
  {
    icon: Twitter,
    title: "Paste-a-tweet import",
    tag: "The wedge",
    desc: "Paste any public X or LinkedIn post URL. We pull the author and text automatically, drop an approved testimonial into your library, and add it to your wall in one click. No screenshots, no copy-paste.",
    cta: "Try it on the homepage",
    href: "/",
  },
  {
    icon: Heart,
    title: "Free hosted Wall of Love",
    tag: "Free on day one",
    desc: "Every workspace gets a public /w/[id] URL — a full Wall of Love you can drop in your Instagram bio, email signature, or QR code before you touch a single line of code. Competitors gate this behind Pro.",
    cta: "See a sample wall",
    href: "/w/demo",
  },
];

/**
 * "Get started in 3 steps" combined with the older Ask → Collect → Publish
 * strip. Both were on the home page telling the same story; consolidated
 * here so /features is the single canonical explainer.
 */
const flowSteps = [
  {
    num: "1",
    title: "Ask",
    body:
      "Share your form link via email, WhatsApp, DM, QR code, or an embed on your site. Or skip the form entirely and paste a customer's tweet directly.",
  },
  {
    num: "2",
    title: "Collect",
    body:
      "Text, star ratings, video (1 free on every plan) — plus praise scraped from App Store, Play Store, Chrome, Product Hunt, Shopify — all land in one inbox.",
  },
  {
    num: "3",
    title: "Publish",
    body:
      "One line of JavaScript embeds the wall on your site. Or share your free hosted Wall of Love URL anywhere — bios, emails, QR codes.",
  },
];

/**
 * Full feature grid — the deep list. Moved from the home page's "Features"
 * section so home stays lean. Icons imported at top for every entry.
 * `category` drives a color-coded left border so scanners can group
 * intake vs display vs plan-perks at a glance.
 */
const features: Array<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  category: "intake" | "curate" | "display" | "plan";
}> = [
  {
    icon: Twitter,
    title: "Paste-a-tweet import",
    desc: "Turn a public X or LinkedIn post into an approved testimonial by pasting the URL. Author and text pulled automatically; you edit the rating if you want.",
    category: "intake",
  },
  {
    icon: Sparkles,
    title: "Screenshot → testimonial (AI)",
    desc: "Drop a screenshot of any praise — DM, tweet, Slack, WhatsApp, email, App Store review — and Claude Vision extracts the quote, author, and source. Free plan: any of your 10 testimonials can be a screenshot. Pro: batch upload multiple at once.",
    category: "intake",
  },
  {
    icon: Send,
    title: "5 collection channels",
    desc: "Share your form via link, embed script, iframe, email template, or QR code. Whichever way your customers arrive, submissions land in the same inbox.",
    category: "intake",
  },
  {
    icon: Inbox,
    title: "One-click approval",
    desc: "Review submissions in a single inbox. Approve the good ones with a click, reject spam. Optimistic UI — no page refresh.",
    category: "curate",
  },
  {
    icon: LayoutGrid,
    title: "5 layouts",
    desc: "Grid, Masonry, Carousel, List, and Marquee. Pick different layouts for different pages of your site — all from one testimonial library.",
    category: "display",
  },
  {
    icon: Code2,
    title: "One-line embed",
    desc: "Copy a single <script> tag and drop it into any HTML. Works on Framer, Webflow, WordPress, Shopify, Next.js, React, Vue — anywhere.",
    category: "display",
  },
  {
    icon: ShieldCheck,
    title: "Shadow DOM isolation",
    desc: "The embed script renders inside a Shadow DOM, so its styles can't leak into your site — and your site's CSS can't break the widget.",
    category: "display",
  },
  {
    icon: Video,
    title: "Video testimonials",
    desc: "1 free video on every plan, unlimited on Pro. Upload MP4 or MOV up to 50MB — plays inline on your wall and embedded widget. Convert ~2× better than text.",
    category: "intake",
  },
  {
    icon: MonitorSmartphone,
    title: "Public Wall of Love URL",
    desc: "Every workspace gets a shareable wall URL — testimoni.io/w/… — public, no signup needed. Drop it in bios, DMs, or a QR code on your packaging.",
    category: "display",
  },
  {
    icon: Share2,
    title: "Ready-to-share templates",
    desc: "Copy-paste WhatsApp, DM, and email asks for customers, plus a downloadable QR code for packaging or receipts. Filling your wall stops being a “what do I even say?” problem.",
    category: "intake",
  },
  {
    icon: Palette,
    title: "Custom branding (Pro)",
    desc: "Change colors, fonts, and border radius to match your site. Remove the Testimoni watermark on Pro.",
    category: "plan",
  },
  {
    icon: Globe,
    title: "Multi-currency pricing",
    desc: "Native INR pricing for Indian customers, USD for everyone else. Razorpay checkout accepts international cards.",
    category: "plan",
  },
  {
    icon: Zap,
    title: "Free forever plan",
    desc: "10 testimonials, 1 form, 1 widget. Grid layout. No credit card. Perfect for launching your site's social proof today.",
    category: "plan",
  },
];

const CATEGORY_META: Record<
  "intake" | "curate" | "display" | "plan",
  { label: string; bg: string; text: string; border: string; iconBg: string }
> = {
  intake: {
    label: "Intake",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    iconBg: "bg-blue-100 text-blue-700",
  },
  curate: {
    label: "Curate",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  display: {
    label: "Display",
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-700",
    border: "border-fuchsia-200",
    iconBg: "bg-fuchsia-100 text-fuchsia-700",
  },
  plan: {
    label: "Plan",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    iconBg: "bg-amber-100 text-amber-700",
  },
};

// PathStep — moved from src/app/page.tsx along with the two-intake-path
// section it belongs to.
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

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <LovedByFoundersStrip />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-5xl px-4">
          {/* Hero */}
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              Features
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Paste a tweet.{" "}
              <span className="text-primary">Build a Wall of Love in a day.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Two things nobody else does as smoothly: import praise you
              already have from X, LinkedIn, App Store, or a screenshot in
              seconds, and share a hosted wall of love free on day one. The
              rest is testimonial-tool table stakes — done well.
            </p>
          </div>

          {/* Headline wedges */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {headlineWedges.map((w) => (
              <div
                key={w.title}
                className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6"
              >
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {w.tag}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                  <w.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-4 text-xl font-bold">{w.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{w.desc}</p>
                <TrackedLink
                  cta={`features_wedge_${w.title.toLowerCase().replace(/\s+/g, "_")}`}
                  surface="features"
                  href={w.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {w.cta} <ArrowRight className="h-3.5 w-3.5" />
                </TrackedLink>
              </div>
            ))}
          </div>

          {/* How it works — moved from home. Merges the compact
              "Ask/Collect/Publish" strip and the longer "Get started
              in 3 steps" section; those told the same story twice on
              home. Here in /features it lives once, canonical. */}
          <section id="how-it-works" className="mt-20 scroll-mt-20">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                The flow
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Ask → Collect → Publish
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Every wall on Testimoni follows the same three-step flow. From
                zero to a live wall in about 30 seconds if you have public
                praise, one afternoon if you&rsquo;re starting from scratch.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {flowSteps.map((step, i) => {
                const gradients = [
                  "from-blue-500/10 via-transparent to-transparent border-blue-500/30",
                  "from-emerald-500/10 via-transparent to-transparent border-emerald-500/30",
                  "from-fuchsia-500/10 via-transparent to-transparent border-fuchsia-500/30",
                ];
                const numBg = ["bg-blue-500", "bg-emerald-500", "bg-fuchsia-500"];
                return (
                  <div
                    key={step.num}
                    className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 ${gradients[i]}`}
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${numBg[i]} text-lg font-bold text-white`}>
                      {step.num}
                    </div>
                    <p className="mt-4 text-lg font-bold text-foreground">
                      {step.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Two intake paths — moved from home's Path B callout.
              Home used this to break down where new testimonials
              come from; the story is stronger here alongside the
              rest of the feature depth. */}
          <section id="collect" className="mt-20 scroll-mt-20">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Two intake paths
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Praise you have, praise you don&rsquo;t yet.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                If your customers already praise you publicly, import in
                seconds. If they don&rsquo;t, send a form. Both end at the same
                wall, one library, one embed.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-6">
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Path A · Paste-a-tweet
                </div>
                <h3 className="text-lg font-semibold">You already have praise</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Any public X or LinkedIn post URL → live testimonial in 30
                  seconds. Or drop a screenshot of a DM, Slack, WhatsApp,
                  email — Claude Vision extracts the quote and author for you.
                  Or paste an App Store, Play Store, Chrome, Product Hunt, or
                  Shopify URL — we sync the reviews.
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-6">
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Path B · Collect via form
                </div>
                <h3 className="text-lg font-semibold">Want to collect new testimonials?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share a form link with your customers — text, star ratings,
                  and video (1 free, unlimited on Pro).
                </p>
                <ol className="mt-5 space-y-3">
                  <PathStep number={1}>Share your collection form URL, QR code, or embed</PathStep>
                  <PathStep number={2}>Customers submit — lands in your inbox for review</PathStep>
                  <PathStep number={3}>Approve — it&apos;s live on your wall</PathStep>
                </ol>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                ↓ Both end at your Wall of Love — one URL, one embed, one library ↓
              </div>
            </div>
          </section>

          {/* Animated demo — the form → approve → widget path visual.
              Moved from home so the intake-path story has one canonical
              home. */}
          <section className="mt-20">
            <div className="text-center">
              <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-muted-foreground">
                Here&apos;s Path B in action — click through, it&apos;s live.
              </p>
            </div>
            <AnimatedDemo />
          </section>

          {/* Video testimonials pitch — moved from home. Was an outsized
              80-line mid-page interruption there; makes sense here as
              part of the deep feature dive. */}
          <section id="video" className="mt-20 scroll-mt-20 rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-background p-8 md:p-12">
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
                  text alone — nothing beats seeing a real customer say real
                  words.
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
                  <TrackedLink cta="features_video_pricing" surface="features" href="/pricing">
                    <Button variant="outline">
                      See pricing <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </TrackedLink>
                </div>
              </div>

              {/* Mockup video testimonial card */}
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
                      <p className="text-xs text-muted-foreground">Course creator · 45s video</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Sample video testimonial card
                </p>
              </div>
            </div>
          </section>

          {/* Full feature grid — color-coded by category (Intake /
              Curate / Display / Plan) so scanners can pattern-match
              the shape of the product before reading. */}
          <section id="features" className="mt-20 scroll-mt-20">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary">
              Every feature, in one place
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight md:text-4xl">
              Everything Testimoni does
            </h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
              {(["intake", "curate", "display", "plan"] as const).map((c) => (
                <div
                  key={c}
                  className={`inline-flex items-center gap-1.5 rounded-full ${CATEGORY_META[c].bg} ${CATEGORY_META[c].text} ${CATEGORY_META[c].border} border px-2.5 py-1 font-semibold uppercase tracking-wider`}
                >
                  {CATEGORY_META[c].label}
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const meta = CATEGORY_META[f.category];
                return (
                  <div
                    key={f.title}
                    className={`rounded-2xl border bg-card p-6 transition hover:shadow-md ${meta.border}`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.iconBg}`}
                      >
                        <f.icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`rounded-full ${meta.bg} ${meta.text} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Try free CTA */}
          <div className="mt-20 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:gap-8">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Try every feature free</h2>
                <p className="mt-2 text-muted-foreground">
                  30-second setup. Free plan works forever. Every feature above
                  is on the free tier — you only upgrade when you outgrow the
                  limits.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <TrackedLink cta="features_try_demo" surface="features" href="/demo">Try the live demo</TrackedLink>
                  </Button>
                  <Button variant="ghost" asChild>
                    <TrackedLink cta="features_sample_wall" surface="features" href="/w/demo">See a Sample Wall</TrackedLink>
                  </Button>
                </div>
              </div>
              <InlineSignup source="features" idPrefix="features" />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            &larr; Back to home
          </Link>
          <span className="mx-3">·</span>
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
