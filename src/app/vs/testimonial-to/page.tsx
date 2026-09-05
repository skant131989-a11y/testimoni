import Link from "next/link";
import type { Metadata } from "next";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Testimonial.to alternative — Paste a Tweet, Free Wall of Love",
  description:
    "Looking for a Testimonial.to alternative? Testimoni lets you paste an X or LinkedIn URL and get an approved testimonial in 30 seconds. Every workspace gets a hosted Wall of Love URL on the free plan. Pro at $9/month.",
  alternates: { canonical: "/vs/testimonial-to" },
  openGraph: {
    title: "Testimoni vs Testimonial.to — Testimonial widget comparison",
    description:
      "The Testimonial.to alternative for SaaS founders, coaches, and D2C brands. Free hosted wall, auto-add on approve, cheaper Pro, native INR pricing.",
    url: "/vs/testimonial-to",
  },
};

interface Row {
  feature: string;
  testimoni: string | boolean;
  theirs: string | boolean;
  highlight?: boolean;
}

const rows: Row[] = [
  { feature: "Free plan testimonials", testimoni: "10", theirs: "10" },
  { feature: "Free plan collection forms / spaces", testimoni: "1", theirs: "2" },
  { feature: "Free plan widgets", testimoni: "1", theirs: "2" },
  {
    feature: "Hosted Wall of Love page on free plan",
    testimoni: true,
    theirs: false,
    highlight: true,
  },
  {
    feature: "Auto-add testimonials to widget on approve",
    testimoni: true,
    theirs: false,
    highlight: true,
  },
  {
    feature: "Import from tweet / LinkedIn URL",
    testimoni: true,
    theirs: true,
  },
  { feature: "Pro starting price", testimoni: "$9/mo · ₹499", theirs: "$50+/mo", highlight: true },
  { feature: "Native INR pricing (India-first)", testimoni: true, theirs: false, highlight: true },
  { feature: "One library → unlimited widgets (Pro)", testimoni: true, theirs: true },
  { feature: "Video testimonials", testimoni: true, theirs: true },
  {
    feature: "5 layouts (Grid, Masonry, Carousel, List, Marquee)",
    testimoni: true,
    theirs: true,
  },
  { feature: "One-line embed with Shadow DOM isolation", testimoni: true, theirs: true },
];

export default function TestimonialToVsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              Comparison
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Testimoni vs Testimonial.to
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Two headline differences: <span className="font-semibold text-foreground">paste any X or LinkedIn URL and get an approved testimonial in 30 seconds</span>, and{" "}
              <span className="font-semibold text-foreground">a public Wall of Love URL free on day one</span> —
              Testimonial.to has neither. Everything else below is the standard
              testimonial-tool comparison.
            </p>
          </div>

          {/* Big differentiators */}
          <section className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Paste-a-tweet import</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Paste an X or LinkedIn URL — we pull the author and text.
                Testimonial.to has no URL-import flow.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Free hosted Wall of Love</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Every workspace gets a public URL to share in your Instagram
                bio. Testimonial.to doesn&apos;t have a dedicated hosted wall.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">One-fifth the Pro price</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Testimoni Pro is $9/mo. Testimonial.to&apos;s Startup tier is
                $50+. Native INR pricing at ₹499/mo for Indian teams.
              </p>
            </div>
          </section>

          {/* Table */}
          <div className="mt-12 overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="p-4 text-left font-semibold">Feature</th>
                  <th className="p-4 text-left font-semibold text-primary">Testimoni</th>
                  <th className="p-4 text-left font-semibold text-muted-foreground">Testimonial.to</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.feature}
                    className={
                      row.highlight
                        ? "border-b bg-primary/5 last:border-0"
                        : "border-b last:border-0"
                    }
                  >
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4">
                      {typeof row.testimoni === "boolean" ? (
                        row.testimoni ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )
                      ) : (
                        <span className="font-medium">{row.testimoni}</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {typeof row.theirs === "boolean" ? (
                        row.theirs ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )
                      ) : (
                        <span>{row.theirs}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="mt-16 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
              <h2 className="text-xl font-bold">Pick Testimoni if…</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• You want a hosted Wall of Love URL without paying for Pro</li>
                <li>• You want testimonials live on your wall the moment you approve them</li>
                <li>• You want a Pro plan that starts under $10/mo</li>
                <li>• You&apos;re building for Indian customers (native INR pricing)</li>
                <li>• You value simple, fast UI over a mature enterprise product</li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="text-xl font-bold">Pick Testimonial.to if…</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Video testimonials are your #1 use case and the polish matters</li>
                <li>• You want 2 free spaces vs Testimoni&apos;s 1 form limit</li>
                <li>• Your budget allows for Startup at $50/mo</li>
                <li>• You want the longest-established brand with the most social proof</li>
              </ul>
            </div>
          </section>

          <div className="mt-16 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">
              Try Testimoni free — 30-second setup
            </h2>
            <p className="mt-2 text-muted-foreground">
              10 testimonials, 1 form, 1 widget, hosted Wall of Love. No credit card.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <TrackedLink cta="vs_ttto_bottom_signup" surface="vs_testimonial_to" href="/signup">
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </TrackedLink>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <TrackedLink cta="vs_ttto_bottom_wall" surface="vs_testimonial_to" href="/w/demo">See a Sample Wall</TrackedLink>
              </Button>
            </div>
          </div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            Comparison last reviewed August 2026. Testimonial.to&apos;s pricing
            and features may have changed since — check{" "}
            <a
              href="https://testimonial.to"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              testimonial.to
            </a>{" "}
            for the latest.
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
