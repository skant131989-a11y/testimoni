import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Code2, LayoutGrid, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS, pageBreadcrumbs } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export const metadata: Metadata = {
  title: "Testimonial widget for your website — free",
  description:
    "Add a testimonial widget to your website with one line of code. 5 layouts, Shadow DOM isolation, works on Framer, Webflow, WordPress, Shopify and React. Free plan with a hosted Wall of Love.",
  alternates: { canonical: "/testimonial-widget" },
  openGraph: {
    title: "Testimonial widget for your website — Testimoni",
    description:
      "One-line embed, 5 layouts, no CSS conflicts. Free plan: 10 testimonials, 1 widget, hosted Wall of Love.",
    url: "/testimonial-widget",
  },
};

const LAYOUTS = ["Grid", "Masonry", "Carousel", "List", "Marquee"];
const PLATFORMS = [
  "Framer",
  "Webflow",
  "WordPress",
  "Shopify",
  "Bubble",
  "React",
  "Vue",
  "Next.js",
  "Plain HTML",
];

export default function TestimonialWidgetPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData
        faqs={[...PAGE_FAQS.testimonialWidget]}
        faqId={`${SITE_URL}/testimonial-widget#faq`}
        breadcrumbs={pageBreadcrumbs("Testimonial widget", "/testimonial-widget")}
      />
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Testimonial widget for your website
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Show real customer testimonials on your site with{" "}
              <span className="font-semibold text-foreground">one line of code</span>. Pick a
              layout, paste the script, done — no design work, no CSS conflicts.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <TrackedLink cta="widget_page_hero_signup" surface="testimonial_widget" href="/signup">
                  Get your widget free <ArrowRight className="ml-2 h-4 w-4" />
                </TrackedLink>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <TrackedLink cta="widget_page_hero_demo" surface="testimonial_widget" href="/w/demo">
                  See a live wall
                </TrackedLink>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Free plan · 10 testimonials · 1 widget · No credit card
            </p>
          </div>

          {/* The one-line embed */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold">The whole install is one line</h2>
            <p className="mt-2 text-muted-foreground">
              Copy your widget ID from the dashboard and paste this where you want the
              testimonials to appear.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-2xl border bg-muted/40 p-4 text-sm">
              <code>{`<script src="https://testimoni.io/embed/widget.js" data-widget-id="YOUR_WIDGET_ID"></script>`}</code>
            </pre>
          </section>

          {/* Feature cards */}
          <section className="mt-16 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">5 layouts</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {LAYOUTS.join(", ")}. Switch any time without re-adding testimonials.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">No CSS conflicts</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The widget renders inside a Shadow DOM, so it can&apos;t break your page&apos;s
                styles and your styles can&apos;t break it.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <Video className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-bold">Text and video</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every plan includes 1 video testimonial; Pro unlocks unlimited video.
              </p>
            </div>
          </section>

          {/* Platforms */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold">Works on any website</h2>
            <p className="mt-2 text-muted-foreground">
              If your site can run a script tag, the widget works.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <li key={p} className="rounded-full border bg-card px-3 py-1 text-sm">
                  {p}
                </li>
              ))}
            </ul>
          </section>

          {/* Where testimonials come from */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold">Get testimonials to put in it</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Paste an X or LinkedIn URL and get an approved testimonial in about 30 seconds.",
                "Send a collection form to customers and approve what comes back.",
                "Approved testimonials can be added to your widget automatically.",
                "Not sure what people already say about you? Find it with the free Customer Voice scan.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link href="/tools/customer-voice" className="font-medium text-primary underline-offset-4 hover:underline">
                Scan your product for public customer mentions →
              </Link>
            </p>
          </section>

          {/* Pricing summary */}
          <section className="mt-16 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
            <h2 className="text-2xl font-bold">Free to start</h2>
            <p className="mt-2 text-muted-foreground">
              The free plan includes 10 testimonials, 1 collection form, 1 widget, a hosted Wall of
              Love page and the one-line embed. Pro is $9/month (₹499/month in India).
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <TrackedLink cta="widget_page_pricing_signup" surface="testimonial_widget" href="/signup">
                  Start free
                </TrackedLink>
              </Button>
              <Button variant="outline" asChild>
                <TrackedLink cta="widget_page_pricing_link" surface="testimonial_widget" href="/pricing">
                  See pricing
                </TrackedLink>
              </Button>
            </div>
          </section>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            <Code2 className="mr-1 inline h-4 w-4" />
            Step-by-step:{" "}
            <Link
              href="/blog/how-to-add-a-testimonial-widget"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              how to add a testimonial widget to any website
            </Link>
            {" · "}
            <Link href="/vs" className="font-medium text-primary underline-offset-4 hover:underline">
              compare testimonial tools
            </Link>
          </p>
        </div>
      </main>

      <PageFAQ
        heading="Testimonial widget FAQ"
        subheading="Quick answers before you embed."
        faqs={PAGE_FAQS.testimonialWidget}
      />

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
