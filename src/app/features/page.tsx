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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { InlineSignup } from "@/components/inline-signup";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Features — Paste a Tweet, Build a Wall of Love",
  description:
    "Paste an X or LinkedIn URL and get an approved testimonial in 30 seconds. Every workspace gets a hosted Wall of Love URL free. Five collection channels, five widget layouts, one-line embed.",
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

const features = [
  {
    icon: Send,
    title: "5 collection channels",
    desc: "Share your form via link, embed script, iframe, email template, or QR code. Whichever way your customers arrive, submissions land in the same inbox.",
  },
  {
    icon: Inbox,
    title: "One-click approval",
    desc: "Review submissions in a single inbox. Approve the good ones with a click, reject spam. Optimistic UI — no page refresh.",
  },
  {
    icon: LayoutGrid,
    title: "5 layouts",
    desc: "Grid, Masonry, Carousel, List, and Marquee. Pick different layouts for different pages of your site — all from one testimonial library.",
  },
  {
    icon: Code2,
    title: "One-line embed",
    desc: "Copy a single <script> tag and drop it into any HTML. Works on Framer, Webflow, WordPress, Shopify, Next.js, React, Vue — anywhere.",
  },
  {
    icon: ShieldCheck,
    title: "Shadow DOM isolation",
    desc: "The embed script renders inside a Shadow DOM, so its styles can't leak into your site — and your site's CSS can't break the widget.",
  },
  {
    icon: Video,
    title: "Video testimonials",
    desc: "1 free video on every plan, unlimited on Pro. Upload MP4 or MOV up to 50MB — plays inline on your wall and embedded widget. Convert ~2x better than text.",
  },
  {
    icon: Palette,
    title: "Custom branding (Pro)",
    desc: "Change colors, fonts, and border radius to match your site. Remove the Testimoni watermark on Pro.",
  },
  {
    icon: Globe,
    title: "Multi-currency pricing",
    desc: "Native INR pricing for Indian customers, USD for everyone else. Razorpay checkout accepts international cards.",
  },
  {
    icon: Zap,
    title: "Free forever plan",
    desc: "10 testimonials, 1 form, 1 widget. Grid layout. No credit card. Perfect for launching your site's social proof today.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              Features
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Paste a tweet.{" "}
              <span className="text-primary">Build a Wall of Love in a day.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Two things nobody else does as smoothly: import praise you already
              have from X or LinkedIn in seconds, and share a hosted wall of
              love free on day one. Everything else is standard testimonial-
              tool table stakes — solid, but not why you&apos;d switch.
            </p>
          </div>

          {/* Headline wedges — bigger, above the fold, first thing after H1 */}
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

          <p className="mt-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Everything else — the standard stuff, done well
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 md:p-8">
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
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
