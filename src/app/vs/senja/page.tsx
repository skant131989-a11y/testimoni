import Link from "next/link";
import type { Metadata } from "next";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS, vsBreadcrumbs } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export const metadata: Metadata = {
  title: "Senja review and alternative — free testimonial tool",
  description:
    "What is Senja, and is there a Senja alternative? A plain-English look at Senja's testimonial features, plus Testimoni: paste an X or LinkedIn URL, get an approved testimonial in 30 seconds, free hosted Wall of Love. Pro at $9/month.",
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

const SEE_SITE = "See their site";

const rows: Row[] = [
  // Testimoni column = our own facts. Senja cells say "See their site"
  // unless Senja states it itself (video/text collection, import from
  // other platforms) — plans and features change, and we don't want
  // to assert numbers we can't verify.
  { feature: "Free plan testimonials", testimoni: "10", senja: SEE_SITE },
  { feature: "Free plan collection forms", testimoni: "1", senja: SEE_SITE },
  { feature: "Free plan widgets", testimoni: "1", senja: SEE_SITE },
  {
    feature: "Hosted Wall of Love page on free plan",
    testimoni: true,
    senja: SEE_SITE,
    highlight: true,
  },
  {
    feature: "Auto-add testimonials to widget on approve",
    testimoni: true,
    senja: SEE_SITE,
    highlight: true,
  },
  {
    feature: "Import existing praise",
    testimoni: "X, LinkedIn, app stores, Shopify, screenshots",
    senja: "30+ platforms or CSV",
  },
  { feature: "Free plan watermark", testimoni: "Small footer", senja: SEE_SITE },
  { feature: "Pro starting price", testimoni: "$9/mo · ₹499", senja: SEE_SITE, highlight: true },
  { feature: "Native INR pricing (India-first)", testimoni: true, senja: SEE_SITE, highlight: true },
  { feature: "Video testimonials", testimoni: true, senja: true },
  {
    feature: "5 layouts (Grid, Masonry, Carousel, List, Marquee)",
    testimoni: true,
    senja: SEE_SITE,
  },
  { feature: "One-line embed with Shadow DOM isolation", testimoni: true, senja: SEE_SITE },
  { feature: "Multi-currency billing", testimoni: "USD + INR", senja: SEE_SITE },
];

export default function SenjaVsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Per-page structured data — comparison FAQs answering the
          typical "X vs Y" queries. Breadcrumbs render `Home ›
          Compare › Testimoni vs Senja` under the SERP link. */}
      <StructuredData
        faqs={[...PAGE_FAQS.vsSenja]}
        faqId={`${SITE_URL}/vs/senja#faq`}
        breadcrumbs={vsBreadcrumbs("Senja", "senja")}
      />
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
              Two things Testimoni is built around: <span className="font-semibold text-foreground">paste any X or LinkedIn URL and get an approved testimonial in 30 seconds</span>, and{" "}
              <span className="font-semibold text-foreground">a public Wall of Love URL free on day one</span>.
              Below is how the two tools compare — check Senja&apos;s site for their current plans
              and features.
            </p>
          </div>

          {/* What is Senja — people searching the bare name want to
              understand the tool first. Only facts Senja states about
              itself on its own site. */}
          <section className="mt-12 rounded-2xl border bg-card p-6">
            <h2 className="text-xl font-bold">What is Senja?</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Senja is a testimonial platform for collecting, managing and displaying customer
              testimonials. By its own description, you can collect video and text testimonials
              through forms, import existing ones from 30+ platforms or a CSV, and show them with
              embeddable widgets and a &ldquo;Wall of Love&rdquo;. It has a free plan and two paid plans.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Summarised from{" "}
              <a href="https://senja.io" target="_blank" rel="noopener noreferrer" className="underline">
                senja.io
              </a>
              , September 2026. Check their site for current plans and pricing.
            </p>
          </section>

          {/* Big differentiators — hero cards */}
          <section className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Paste-a-tweet import</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Paste an X or LinkedIn URL — we pull the author and text, and you
                approve it. First testimonial in about 30 seconds.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Free hosted Wall of Love</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Every workspace gets a public URL on the free plan. Drop it in
                your Instagram bio.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Simple pricing</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Testimoni Pro is $9/mo, or ₹499/mo with native INR billing for
                Indian teams.
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
                <li>• You want a hosted Wall of Love URL without paying for Pro</li>
                <li>• You want testimonials you import to go live on your wall straight away, while form submissions wait for your approval so nothing unvetted goes public</li>
                <li>• You want to pull praise in from where it already lives — X and LinkedIn URLs, App Store, Google Play, Chrome Web Store, Shopify and Product Hunt reviews, even screenshots of DMs and emails</li>
                <li>• You want to see what people already say about you before you ask — the free Customer Voice scan finds public mentions and sorts praise from complaints and feature requests</li>
                <li>• You want an AI chatbot on your site that answers visitor questions using only your real testimonials (Ask My Wall, Pro)</li>
                <li>• You want a Pro plan that starts at $9/mo</li>
                <li>• You&apos;re an Indian founder or serving Indian customers (INR billing)</li>
                <li>• You&apos;re new and value fast, minimal UI over a mature product</li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="text-xl font-bold">Pick Senja if…</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• You&apos;re already on Senja and it&apos;s working — switch only if a specific gap matters to you</li>
                <li>• Their current plans and limits fit your needs better — compare on their site</li>
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

      <PageFAQ
        heading="Testimoni vs Senja FAQ"
        subheading="Five questions we get from people comparing the two."
        faqs={PAGE_FAQS.vsSenja}
      />

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
