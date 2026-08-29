import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, Code, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "How to add a testimonial widget to your website in 5 minutes",
  description:
    "A step-by-step guide to adding a testimonial widget to any website — from collecting your first testimonial to embedding a wall of love with one line of code. Works on Framer, Webflow, WordPress, React, and vanilla HTML.",
  alternates: { canonical: "/blog/how-to-add-a-testimonial-widget" },
  openGraph: {
    title: "How to add a testimonial widget to your website in 5 minutes",
    description:
      "Step-by-step guide: collect testimonials, curate a library, embed a wall of love — with one line of code. Works on any site.",
    url: "/blog/how-to-add-a-testimonial-widget",
  },
};

export default function TestimonialWidgetGuidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <article className="mx-auto max-w-3xl px-4">
          {/* Header */}
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              Guide
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              How to add a testimonial widget to your website in 5 minutes
            </h1>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> 5 min read
              </span>
              <span>·</span>
              <time dateTime="2026-08-29">Aug 29, 2026</time>
            </div>
          </div>

          <div className="prose prose-neutral mt-12 max-w-none dark:prose-invert">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Adding a <strong>testimonial widget</strong> to your website is the
              fastest way to turn happy customers into social proof — and it&apos;s
              easier than you think. This guide walks you through the entire flow:
              collect testimonials, curate a library, and embed a beautiful wall
              of love on your homepage in under five minutes. No design skills or
              backend code required.
            </p>

            <h2 className="mt-10 text-2xl font-bold">Why you need a testimonial widget</h2>
            <p>
              Social proof is one of the highest-ROI conversion levers on your
              site. Prospective customers spend an average of 4-8 seconds
              deciding whether to trust you. A well-designed testimonial widget
              — real names, real headshots, real reviews — shortens that
              decision.
            </p>
            <p>
              But most founders skip it because the setup is a mess: emailing
              customers for a quote, chasing them for a photo, pasting into
              Google Docs, then hand-coding HTML for your site. Two months
              later, you still have zero testimonials live.
            </p>
            <p>
              A dedicated testimonial widget solves this end-to-end: one form to
              collect, one inbox to approve, one embed to display.
            </p>

            {/* Step-by-step */}
            <h2 className="mt-10 text-2xl font-bold">The 5-minute setup</h2>

            <div className="not-prose mt-6 space-y-6">
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    1
                  </div>
                  <h3 className="text-lg font-semibold">Create a collection form</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Sign up for a testimonial widget platform (like{" "}
                  <Link href="/" className="text-primary underline">Testimoni</Link>) and create
                  your first collection form. Set the headline (&quot;Share your
                  experience&quot;), enable star ratings, and choose whether to
                  accept video testimonials.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Estimated time:</strong> 1 minute
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    2
                  </div>
                  <h3 className="text-lg font-semibold">Share the form with customers</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Choose one (or all) of these channels:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                  <li>Direct link (paste in emails, DMs, Slack)</li>
                  <li>Embed script (floating button on your existing site)</li>
                  <li>iFrame (full form on a dedicated /share page)</li>
                  <li>QR code (for print, packaging, or in-store)</li>
                </ul>
                <p className="mt-3 text-sm text-muted-foreground">
                  <strong>Estimated time:</strong> 1 minute
                </p>
              </div>

              {/* Inline CTA #1 — user just read about sharing the form,
                  showing them the end result reinforces the payoff. */}
              <div className="not-prose flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold">
                    💜 Want to see what the end result looks like?
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Peek at a real Wall of Love — same layout you&apos;ll be
                    building.
                  </p>
                </div>
                <Link
                  href="/w/demo"
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  See a Sample Wall <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    3
                  </div>
                  <h3 className="text-lg font-semibold">Approve incoming testimonials</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  As customers submit, they land in your inbox. Review each one,
                  approve the good ones, and reject spam. Approved testimonials
                  move to your library.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Estimated time:</strong> 30 seconds per testimonial
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    4
                  </div>
                  <h3 className="text-lg font-semibold">Build a widget</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Pick a layout (Grid, Masonry, Carousel, List, or Marquee),
                  choose which testimonials to include, and adjust the theme
                  colors to match your brand. Preview updates live.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Estimated time:</strong> 2 minutes
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    5
                  </div>
                  <h3 className="text-lg font-semibold">Embed on your site</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Copy one line of code and paste it wherever you want the
                  widget to appear:
                </p>
                <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  <code>{`<script src="https://testimoni.io/embed/widget.js" data-widget-id="wgt_XXXXXXXX"></script>`}</code>
                </pre>
                <p className="mt-3 text-sm text-muted-foreground">
                  Works on any site: Framer, Webflow, WordPress, Shopify,
                  Bubble, React, Vue, Next.js, or vanilla HTML. Shadow DOM
                  isolation means zero CSS conflicts with your host page.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Estimated time:</strong> 30 seconds
                </p>
              </div>
            </div>

            {/* Inline CTA #2 — after user just learned about embedding,
                introduce the hosted-wall alternative for no-code users. */}
            <div className="not-prose mt-8 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold">
                  ⚡ Not ready to embed? Share a hosted URL instead.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Every workspace gets a public Wall of Love URL you can paste
                  in your Instagram bio, email signature, or WhatsApp status —
                  zero code required.
                </p>
              </div>
              <Link
                href="/w/demo"
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                See a Sample Wall <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <h2 className="mt-12 text-2xl font-bold">Which layout should you pick?</h2>
            <p>
              Different layouts serve different pages:
            </p>
            <ul>
              <li>
                <strong>Grid</strong> — best for a dedicated &quot;testimonials&quot;
                landing section. Shows 3–6 quotes evenly. Neutral, fits any brand.
              </li>
              <li>
                <strong>Masonry</strong> — Pinterest-style variable heights. Great
                for showcasing longer quotes alongside shorter ones.
              </li>
              <li>
                <strong>Carousel</strong> — one testimonial at a time, auto-rotates.
                Space-efficient — perfect for pricing pages.
              </li>
              <li>
                <strong>List</strong> — vertical stack. Minimal, works well on
                landing pages between other sections.
              </li>
              <li>
                <strong>Marquee</strong> — infinite horizontal scroll. Eye-catching,
                a great hero-section addition.
              </li>
            </ul>

            <h2 className="mt-10 text-2xl font-bold">Should you show different widgets on different pages?</h2>
            <p>
              Yes. This is where a good testimonial widget shines. Collect once
              — build a different widget for every page:
            </p>
            <ul>
              <li>Homepage grid → your 6 best all-around testimonials</li>
              <li>Pricing carousel → only Enterprise / high-tier customer stories</li>
              <li>Product page marquee → 5-star quotes about that specific feature</li>
              <li>Landing page list → industry-specific quotes for that campaign</li>
            </ul>
            <p>
              Same library. Different curation per widget. Higher conversion on
              every page.
            </p>

            <div className="not-prose mt-12 rounded-2xl bg-primary/5 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">Try Testimoni free</h2>
              <p className="mt-2 text-muted-foreground">
                Free forever plan: 10 testimonials, 1 form, 1 widget. Set up in 5 minutes. No credit card.
              </p>
              <Button size="lg" asChild className="mt-6">
                <Link href="/signup">
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="mt-4 text-xs text-muted-foreground">
                Or{" "}
                <Link href="/demo" className="text-primary underline">
                  see the live demo
                </Link>{" "}
                first — no sign-up needed.
              </div>
            </div>

            <h2 className="mt-12 text-2xl font-bold">Frequently asked questions</h2>
            <h3 className="mt-6 text-lg font-semibold">Do I need to write any code?</h3>
            <p>
              Only one line — the embed script. Everything else (form design,
              approval, widget building, curation) happens in a visual dashboard.
              No HTML, CSS, or JavaScript knowledge required.
            </p>

            <h3 className="mt-6 text-lg font-semibold">Will the widget mess up my site&apos;s styling?</h3>
            <p>
              No. The embed script renders inside a Shadow DOM, which isolates
              its CSS from your site. Whatever font, color, or padding you use
              on your host page won&apos;t leak into the widget, and vice versa.
            </p>

            <h3 className="mt-6 text-lg font-semibold">Can customers submit video testimonials?</h3>
            <p>
              Yes on the Pro plan. Free plans currently support text testimonials
              with photos and star ratings. Video adds ~2x the perceived
              authenticity but the setup is identical from your side.
            </p>

            <h3 className="mt-6 text-lg font-semibold">What&apos;s the difference between a testimonial widget and a review widget?</h3>
            <p>
              Testimonial widgets typically embed hand-picked customer quotes
              you&apos;ve collected and approved. Review widgets pull from public
              platforms (Google Reviews, Trustpilot, G2). Testimonials give you
              tighter curation; review widgets give you third-party validation.
              Both have their place — many sites use both.
            </p>

            <h3 className="mt-6 text-lg font-semibold">How much does a testimonial widget cost?</h3>
            <p>
              Most testimonial widget platforms offer a free plan for early
              users. Paid plans typically start at $9–$19/month, with premium
              tiers for teams and higher testimonial counts.{" "}
              <Link href="/pricing" className="text-primary underline">See Testimoni pricing</Link>.
            </p>
          </div>

          {/* Related pages */}
          <div className="mt-16 rounded-2xl border p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Code className="h-4 w-4" /> Related
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <Link href="/pricing" className="text-primary hover:underline">
                  Testimoni pricing
                </Link>
              </li>
              <li>
                <Link href="/demo" className="text-primary hover:underline">
                  Live demo (no sign-up)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary hover:underline">
                  Contact us
                </Link>
              </li>
            </ul>
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
