import Link from "next/link";
import type { Metadata } from "next";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Senja alternative — Paste a Tweet, Free Wall of Love",
  description:
    "Looking for a Senja alternative? Testimoni lets you paste an X or LinkedIn URL and get an approved testimonial in 30 seconds. Every workspace gets a hosted Wall of Love URL on the free plan. Pro at $9/month.",
  alternates: { canonical: "/vs/senja" },
  openGraph: {
    title: "Testimoni vs Senja — Testimonial widget comparison",
    description:
      "The Senja alternative for SaaS founders, coaches, and D2C brands. Free hosted wall, auto-add on approve, cheaper Pro, native INR pricing.",
    url: "/vs/senja",
  },
};

interface Row {
  feature: string;
  testimoni: string | boolean;
  senja: string | boolean;
  highlight?: boolean;
}

const rows: Row[] = [
  { feature: "Free plan testimonials", testimoni: "10", senja: "10" },
  { feature: "Free plan collection forms", testimoni: "1", senja: "Multiple" },
  { feature: "Free plan widgets", testimoni: "1", senja: "1" },
  {
    feature: "Hosted Wall of Love page on free plan",
    testimoni: true,
    senja: false,
    highlight: true,
  },
  {
    feature: "Auto-add testimonials to widget on approve",
    testimoni: true,
    senja: false,
    highlight: true,
  },
  {
    feature: "Import from tweet / LinkedIn URL",
    testimoni: true,
    senja: true,
  },
  { feature: "Free plan watermark", testimoni: "Small footer", senja: "Small footer" },
  { feature: "Pro starting price", testimoni: "$9/mo · ₹499", senja: "$19+/mo", highlight: true },
  { feature: "Native INR pricing (India-first)", testimoni: true, senja: false, highlight: true },
  { feature: "One library → unlimited widgets (Pro)", testimoni: true, senja: true },
  { feature: "Video testimonials", testimoni: true, senja: true },
  {
    feature: "5 layouts (Grid, Masonry, Carousel, List, Marquee)",
    testimoni: true,
    senja: true,
  },
  { feature: "One-line embed with Shadow DOM isolation", testimoni: true, senja: true },
  { feature: "Multi-currency billing", testimoni: "USD + INR", senja: "USD" },
  { feature: "Open-source / self-host", testimoni: false, senja: false },
];

export default function SenjaVsPage() {
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
              Testimoni vs Senja
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Two headline differences: <span className="font-semibold text-foreground">paste any X or LinkedIn URL and get an approved testimonial in 30 seconds</span>, and{" "}
              <span className="font-semibold text-foreground">a public Wall of Love URL free on day one</span> —
              Senja gates both. Everything else below is the standard
              testimonial-tool comparison.
            </p>
          </div>

          {/* Big differentiators — hero cards */}
          <section className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Paste-a-tweet import</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Paste an X or LinkedIn URL — we pull the author and text.
                Senja makes you screenshot or copy-paste.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Free hosted Wall of Love</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Every workspace gets a public URL. Drop it in your Instagram bio.
                Senja gates this behind Pro.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Half the Pro price</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Testimoni Pro is $9/mo. Senja starts around $19/mo. Native INR
                pricing for Indian teams too.
              </p>
            </div>
          </section>

          {/* Feature table */}
          <div className="mt-12 overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="p-4 text-left font-semibold">Feature</th>
                  <th className="p-4 text-left font-semibold text-primary">Testimoni</th>
                  <th className="p-4 text-left font-semibold text-muted-foreground">Senja</th>
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
                      {typeof row.senja === "boolean" ? (
                        row.senja ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )
                      ) : (
                        <span>{row.senja}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Honest recommendation */}
          <section className="mt-16 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
              <h2 className="text-xl font-bold">Pick Testimoni if…</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• You want a hosted Wall of Love without paying for Pro</li>
                <li>• You want approved testimonials live instantly (auto-add)</li>
                <li>• You&apos;re price-sensitive — $9/mo Pro vs Senja&apos;s $19+</li>
                <li>• You&apos;re an Indian founder or serving Indian customers (INR billing)</li>
                <li>• You&apos;re new and value fast, minimal UI over a mature product</li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="text-xl font-bold">Pick Senja if…</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• You need deep integrations (Zapier, native CRM connectors)</li>
                <li>• You&apos;re on the Senja team plan and value seat-based pricing</li>
                <li>• You want a product with years of user reviews and support history</li>
                <li>• Manual curation on approve is a feature, not a bug, for you</li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <div className="mt-16 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">
              Try Testimoni free — 30-second setup
            </h2>
            <p className="mt-2 text-muted-foreground">
              10 testimonials, 1 form, 1 widget, hosted Wall of Love. No credit card.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <TrackedLink cta="vs_senja_bottom_signup" surface="vs_senja" href="/signup">
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </TrackedLink>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <TrackedLink cta="vs_senja_bottom_wall" surface="vs_senja" href="/w/demo">See a Sample Wall</TrackedLink>
              </Button>
            </div>
          </div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            Comparison last reviewed August 2026. Senja&apos;s pricing and
            features may have changed since — check{" "}
            <a
              href="https://senja.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              senja.io
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
