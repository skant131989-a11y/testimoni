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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { InlineSignup } from "@/components/inline-signup";

export const metadata: Metadata = {
  title: "Features — Testimoni",
  description:
    "Every feature Testimoni ships: multi-channel collection forms, curated widgets, five layouts, Shadow DOM embed, video testimonials, and more.",
  alternates: { canonical: "/features" },
};

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
    title: "Video testimonials (Pro)",
    desc: "Customers submit short video reviews from their phone or laptop. Video testimonials convert ~2x better than text alone.",
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
              Everything you need to ship social proof
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Collect, curate, and embed customer testimonials — end to end. No
              piecing together forms, spreadsheets, and hand-coded HTML.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  5-minute setup. Free plan works forever. Every feature above
                  is on the free tier — you only upgrade when you outgrow the
                  limits.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/demo">Try the live demo</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/w/demo">See a Sample Wall</Link>
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
