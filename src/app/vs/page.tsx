import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS, pageBreadcrumbs } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export const metadata: Metadata = {
  title: "Senja & Testimonial.to alternatives compared",
  description:
    "Comparing testimonial tools? See how Testimoni stacks up as a Senja alternative and a Testimonial.to alternative — free plans, hosted wall, import options and pricing.",
  alternates: { canonical: "/vs" },
  openGraph: {
    title: "Testimonial tool alternatives — Testimoni",
    description:
      "Feature-by-feature comparisons: Testimoni vs Senja and Testimoni vs Testimonial.to.",
    url: "/vs",
  },
};

const COMPARISONS = [
  {
    href: "/vs/senja",
    title: "Testimoni vs Senja",
    blurb:
      "Looking for a Senja alternative? Paste-a-URL import, a hosted Wall of Love on the free plan, and Pro at $9/month.",
  },
  {
    href: "/vs/testimonial-to",
    title: "Testimoni vs Testimonial.to",
    blurb:
      "Looking for a Testimonial.to alternative? Text and video testimonials, one-line embed, and INR pricing.",
  },
];

const CHECKLIST = [
  "Free-plan limits — how many testimonials, forms and widgets you get before paying",
  "Hosted wall page — a public URL you can share, or only an embed",
  "Import options — forms only, or also existing tweets and LinkedIn posts",
  "Embed method — and whether it can conflict with your site's CSS",
  "Pricing in your currency, including local-currency billing",
];

export default function VsIndexPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData
        faqs={[...PAGE_FAQS.vsIndex]}
        faqId={`${SITE_URL}/vs#faq`}
        breadcrumbs={pageBreadcrumbs("Compare", "/vs")}
      />
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Testimonial tool alternatives
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Choosing a testimonial tool? Here&apos;s how Testimoni compares with the tools people
              most often consider, with an honest &ldquo;pick them if&hellip;&rdquo; section on each page.
            </p>
          </div>

          <section className="mt-12 grid gap-4 md:grid-cols-2">
            {COMPARISONS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group rounded-2xl border-2 bg-card p-6 transition-colors hover:border-primary"
              >
                <h2 className="text-xl font-bold">{c.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Read the comparison <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </section>

          <section className="mt-16">
            <h2 className="text-2xl font-bold">What to compare before you choose</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-16 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Try Testimoni free — 30-second setup</h2>
            <p className="mt-2 text-muted-foreground">
              10 testimonials, 1 form, 1 widget, hosted Wall of Love. No credit card.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <TrackedLink cta="vs_index_signup" surface="vs_index" href="/signup">
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </TrackedLink>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <TrackedLink cta="vs_index_widget" surface="vs_index" href="/testimonial-widget">
                  About the testimonial widget
                </TrackedLink>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <PageFAQ
        heading="Choosing a testimonial tool: FAQ"
        subheading="Short answers to the questions we hear most."
        faqs={PAGE_FAQS.vsIndex}
      />

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
