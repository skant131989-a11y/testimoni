import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Star, ArrowRight, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/letter-avatar";
import { InlineSignup } from "@/components/inline-signup";
import { TrackedLink } from "@/components/tracked-link";
import { PageEngagement } from "@/components/page-engagement";
import { WallDemoFloatingCta } from "@/components/wall-demo-floating-cta";

export const metadata: Metadata = {
  title: "Example Wall of Love — Testimoni",
  description:
    "A sample Wall of Love, built with Testimoni. See what your own hosted wall could look like — sample quotes from Testimoni customers.",
  alternates: { canonical: "/w/demo" },
  openGraph: {
    title: "Sample Wall of Love — Testimoni",
    description:
      "See a live example of a Testimoni Wall of Love. Free plan builds one just like this in minutes.",
    url: "/w/demo",
  },
};

const WORKSPACE = "LinenLab";

// Product-focused sample quotes — what Testimoni customers actually
// say about the product. Deliberately generic personas (SaaS founder,
// course creator, D2C, indie, agency, freelancer) so nobody reads
// them as testimonials from a real coach's clients.
const TESTIMONIALS: {
  id: string;
  content: string;
  rating: number;
  customerName: string;
  customerTitle: string;
  /** Marks one card as a video variant so /w/demo shows what a
   *  video testimonial looks like without shipping actual video
   *  bytes. Just the thumbnail + play icon + PRO badge. */
  video?: boolean;
}[] = [
  {
    id: "d1",
    content:
      "We pasted 8 customer tweets and the homepage finally had proof.",
    rating: 5,
    customerName: "Sarah Chen",
    customerTitle: "SaaS founder",
  },
  {
    id: "d2",
    content:
      "Students fill the form after the cohort. Widget is on the sales page the same day.",
    rating: 5,
    customerName: "Marcus Johnson",
    customerTitle: "Course creator",
  },
  {
    id: "d3",
    content:
      "Post-delivery form → 5-star quotes on the product page. No app store install.",
    rating: 5,
    customerName: "Priya Menon",
    customerTitle: "Shopify / D2C",
  },
  {
    id: "d4",
    content:
      "Free plan was enough to replace the Notion doc of screenshots.",
    rating: 5,
    customerName: "Jamal Wilson",
    customerTitle: "Indie hacker",
  },
  {
    id: "d5",
    content:
      "One workspace, different widgets per client site.",
    rating: 5,
    customerName: "Emily Rodriguez",
    customerTitle: "Agency owner",
  },
  {
    id: "d6",
    content:
      "One-line embed dropped in Framer. Wall refreshes when I approve.",
    rating: 5,
    customerName: "Aditi Rao",
    customerTitle: "Freelance designer",
  },
  {
    // 7th testimonial — video variant. Positioned in the center of
    // row 3 (col 2) on the 3-col grid via the render loop's grid
    // classes so it doesn't sit alone at the edge.
    id: "d7",
    content:
      "Recorded a 45-second review from my phone. Now it's the first thing customers see on my product page.",
    rating: 5,
    customerName: "Marcus Johnson",
    customerTitle: "Course creator",
    video: true,
  },
];

export default function DemoWallPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 via-background to-background">
      <PageEngagement surface="wall_demo" />
      <WallDemoFloatingCta />
      {/* Header — mirrors the landing-page header so /w/demo doesn't feel
          like a stripped-down variant. Same logo size, same nav items,
          same button hierarchy. */}
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
            <TrackedLink cta="wall_demo_nav_demo" surface="wall_demo" href="/demo" className="text-sm text-muted-foreground hover:text-foreground">
              Live Demo
            </TrackedLink>
            <TrackedLink cta="wall_demo_nav_pricing" surface="wall_demo" href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </TrackedLink>
            <TrackedLink cta="wall_demo_nav_login" surface="wall_demo" href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </TrackedLink>
            <TrackedLink cta="wall_demo_nav_signup" surface="wall_demo" href="/signup">
              <Button size="sm">Get Started Free</Button>
            </TrackedLink>
          </nav>
          <TrackedLink cta="wall_demo_nav_mobile_cta" surface="wall_demo" href="/signup" className="md:hidden">
            <Button size="sm">Get Started</Button>
          </TrackedLink>
        </div>
      </header>

      {/* Sample banner — now the one clear "this is a sample" signal on
          the page. Also carries the primary conversion CTA so early
          bouncers see it above the fold. */}
      <div className="bg-primary/10 py-2 text-center text-xs font-medium text-primary">
        <Sparkles className="mr-1 inline-block h-3 w-3" />
        Sample wall —{" "}
        <TrackedLink
          cta="wall_demo_banner_try_it"
          surface="wall_demo"
          href="/demo"
          className="underline underline-offset-2"
        >
          build your own in 30 seconds →
        </TrackedLink>
      </div>

      {/* Hero */}
      <header className="mx-auto max-w-5xl px-4 pt-16 pb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
          L
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Wall of Love
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Sample quotes — what a{" "}
          <span className="font-semibold text-foreground">{WORKSPACE}</span>{" "}
          wall could look like on the free plan.
        </p>
      </header>

      {/* Testimonials grid */}
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.id}
              className={`flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
                // Video variant sits on its own row (7th out of 6+1).
                // Force it into the center column on the 3-col grid
                // and span both columns on the 2-col grid so it
                // never lands orphaned at the edge.
                t.video ? "md:col-span-2 lg:col-span-1 lg:col-start-2" : ""
              }`}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < t.rating
                        ? "h-5 w-5 fill-yellow-400 text-yellow-400"
                        : "h-5 w-5 fill-muted text-muted-foreground/30"
                    }
                  />
                ))}
              </div>
              {/* Video variant — one card in the wall shows what a
                  video testimonial looks like, complete with PRO
                  badge in the corner. Static thumbnail (no actual
                  video bytes) since the sample doesn't need to play,
                  just demonstrate the visual. */}
              {t.video && (
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Video
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <Play className="ml-0.5 h-5 w-5 fill-black text-black" />
                  </div>
                </div>
              )}
              <p className="text-[15px] leading-relaxed text-foreground">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3 pt-1">
                <LetterAvatar name={t.customerName} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {t.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.customerTitle}
                    {t.video && " · 45s video"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Signup CTA — inline form, converts directly on the wall */}
        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:gap-8">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" /> Yours in 5 minutes
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">
                Want a Wall of Love like this?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Collect testimonials from your customers and share a page like
                this one in minutes. Your own URL, updates in real time as
                testimonials come in.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <li>✓ Free forever plan · no credit card</li>
                <li>✓ Public wall URL you can share today</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
            <InlineSignup source="wall_demo" idPrefix="wall-demo" />
          </div>
        </div>
      </main>

      {/* Watermark */}
      <footer className="border-t py-6">
        <p className="text-center text-sm text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Testimoni
          </Link>
          <span className="mx-2 text-muted-foreground/50">·</span>
          <Link
            href="/#demo-video"
            className="font-medium text-primary hover:underline"
          >
            How was this built? (30s →)
          </Link>
        </p>
      </footer>
    </div>
  );
}
