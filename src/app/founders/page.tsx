import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "The Testimoni founder story",
  description:
    "The story behind Testimoni — a solo founder building the fastest testimonial widget for SaaS, coaches, and D2C brands. Built in public, shipping every week.",
  alternates: { canonical: "/founders" },
};

export default function FoundersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <article className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              Founder story
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Why I built Testimoni
            </h1>
            <div className="mx-auto mt-4 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                N
              </div>
              <div className="text-left">
                <p className="font-semibold">Neha Singh</p>
                <p className="text-sm text-muted-foreground">Founder &amp; CEO, Testimoni</p>
              </div>
            </div>
          </div>

          <div className="prose prose-neutral mt-12 max-w-none dark:prose-invert">
            <p className="text-lg leading-relaxed text-muted-foreground">
              I&apos;ve shipped a lot of small products over the years. Every single
              one of them stalled at the same step: getting customer testimonials
              onto the site. Not because customers wouldn&apos;t give them — they
              would — but because the workflow was a mess.
            </p>

            <h2 className="mt-10 text-2xl font-bold">The workflow that never worked</h2>
            <p>
              Here&apos;s the actual sequence I ran, more than once:
            </p>
            <ol>
              <li>Email 20 customers asking for a testimonial.</li>
              <li>Six reply.</li>
              <li>Three of them attach a screenshot of themselves on their phone.</li>
              <li>I copy each quote into a Google Doc.</li>
              <li>I hand-code the testimonials section in HTML.</li>
              <li>Two months later, I need to swap one out — I open the raw HTML file, find the div, edit it, redeploy.</li>
              <li>My homepage still has three testimonials, never gets updated, and looks like an afterthought.</li>
            </ol>
            <p>
              At some point I realized: the tool I actually needed was one that
              handled the whole loop. Customer submits &rarr; I approve &rarr;
              it&apos;s live on my site &rarr; I can swap what shows where without
              touching code.
            </p>

            <h2 className="mt-10 text-2xl font-bold">What Testimoni is</h2>
            <p>
              Testimoni is that tool. A collection form you share five ways
              (link, embed, iframe, email, QR). An inbox where you approve or
              reject submissions in one click. A widget builder where you drop
              approved testimonials into different layouts. And a single script
              tag that renders on any site — Framer, Webflow, WordPress,
              Next.js, plain HTML.
            </p>
            <p>
              The differentiator I care about most: <strong>one library,
              unlimited widgets</strong>. Collect testimonials once. Build a
              different widget for every page — homepage grid, pricing carousel,
              product-page marquee. Same source of truth, different curation.
            </p>

            <h2 className="mt-10 text-2xl font-bold">Shipping in public</h2>
            <p>
              I&apos;m building Testimoni as a solo founder. Every feature, every
              bug fix, every marketing lesson gets posted on{" "}
              <a
                href="https://x.com/usetestimoni"
                target="_blank"
                rel="noopener noreferrer"
              >
                @usetestimoni
              </a>{" "}
              on X and{" "}
              <a
                href="https://www.linkedin.com/company/144771086"
                target="_blank"
                rel="noopener noreferrer"
              >
                on LinkedIn
              </a>
              . If you follow along, you&apos;ll see the exact revenue milestones,
              the customer stories, and the hard trade-offs behind the product
              decisions.
            </p>
            <p>
              If you use Testimoni and something is broken, undersized, or missing
              — tell me directly. I read every email, every DM, every submission
              through our own contact form. I ship changes in the same week.
            </p>

            <h2 className="mt-10 text-2xl font-bold">What&apos;s next</h2>
            <p>
              Short-term: video testimonials, more widget layouts, native
              integrations with Framer and Webflow, a proper CSV import that
              handles messy customer spreadsheets. Long-term: an AI-assisted
              testimonial writer that helps customers phrase their quote, and a
              lightweight A/B test for which testimonials convert best on each
              page.
            </p>
            <p>
              If any of that is on your critical path, sign up for the free plan
              and start collecting today. If you want a specific feature sooner,
              email me — the roadmap is user-driven.
            </p>

            <div className="not-prose mt-12 rounded-2xl bg-primary/5 p-8 text-center">
              <h2 className="text-2xl font-bold">Try Testimoni free</h2>
              <p className="mt-2 text-muted-foreground">
                Free forever plan: 10 testimonials, 1 form, 1 widget. Set up in
                5 minutes. No credit card.
              </p>
              <Button size="lg" asChild className="mt-6">
                <Link href="/signup">
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
