import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Book, Code2, Send, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "Docs — Testimoni",
  description:
    "How to set up Testimoni: create a collection form, share it, approve submissions, build a widget, and embed on any site.",
  alternates: { canonical: "/docs" },
};

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Book className="h-3 w-3" />
              Docs
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Get started in 5 minutes
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Everything you need to collect and display testimonials on your
              site. If something&apos;s missing here, email us — we&apos;ll
              update this page the same day.
            </p>
          </div>

          <section className="mt-16 space-y-8">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">1</div>
                <h2 className="text-2xl font-bold">Create a collection form</h2>
              </div>
              <div className="ml-11 space-y-3 text-sm text-muted-foreground">
                <p>Sign up at <Link href="/signup" className="text-primary underline">testimoni.io/signup</Link>. On first login you land on the collect page — just give your form a name (e.g. &quot;Customer Feedback&quot;) and click Create.</p>
                <p>Free plan gets 1 form. Pro unlocks unlimited forms — one per channel (post-purchase, onboarding, support, etc.).</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">2</div>
                <h2 className="text-2xl font-bold">Share the form</h2>
              </div>
              <div className="ml-11 space-y-3 text-sm text-muted-foreground">
                <p>Every form gives you five channels:</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li><strong>Direct link</strong> — paste in emails, DMs, Slack.</li>
                  <li><strong>Embed script</strong> — floating &quot;Leave a Review&quot; button on your site. One-line install.</li>
                  <li><strong>iFrame</strong> — full form on a dedicated URL you can iframe anywhere.</li>
                  <li><strong>Email template</strong> — pre-written post-purchase email.</li>
                  <li><strong>QR code</strong> — for print, packaging, in-store.</li>
                </ul>
                <p>Grab any of these from <code className="rounded bg-muted px-1">/dashboard/collect</code> after creating a form.</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">3</div>
                <h2 className="text-2xl font-bold">Approve submissions</h2>
              </div>
              <div className="ml-11 space-y-3 text-sm text-muted-foreground">
                <p>New submissions land in <code className="rounded bg-muted px-1">/dashboard/inbox</code>. Review each one, click Approve to add it to your testimonial library or Reject to discard.</p>
                <p>Approved testimonials are available to any widget you build. Rejecting doesn&apos;t delete — you can flip a decision later.</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">4</div>
                <h2 className="text-2xl font-bold">Build a widget</h2>
              </div>
              <div className="ml-11 space-y-3 text-sm text-muted-foreground">
                <p>Go to <code className="rounded bg-muted px-1">/dashboard/widgets</code>, click Create Widget, pick a layout (Grid, Masonry, Carousel, List, or Marquee — Pro plans get all five), and drag in the testimonials you want to feature.</p>
                <p>Free plan: 1 widget, Grid layout only. Pro: unlimited widgets, every layout.</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">5</div>
                <h2 className="text-2xl font-bold">Embed on your site</h2>
              </div>
              <div className="ml-11 space-y-3 text-sm text-muted-foreground">
                <p>From the widget page, grab your embed script:</p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  <code>{`<script src="https://testimoni.io/embed/widget.js" data-widget-id="wgt_XXXXXXXX"></script>`}</code>
                </pre>
                <p>Paste it into any page. Works on Framer, Webflow, WordPress, Shopify, Next.js, React, Vue — or plain HTML. Shadow DOM isolation ensures zero CSS conflicts with your site.</p>
              </div>
            </div>
          </section>

          <section className="mt-16 rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <Code2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">API reference</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Testimoni ships a public widget API at{" "}
              <code className="rounded bg-muted px-1">/api/widget/[widgetId]</code>{" "}
              (JSON, publicly readable, 5-minute CDN cache) and a collect API at{" "}
              <code className="rounded bg-muted px-1">/api/collect/[formId]</code>.
              Both are stable — build your own custom renderer if the default
              layouts don&apos;t fit your site.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Full API docs and REST authentication are coming. For now, email us
              if you need programmatic access.
            </p>
          </section>

          <div className="mt-16 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Try it live</h2>
            <p className="mt-2 text-muted-foreground">
              See the full collect → approve → embed flow. No sign-up required.
            </p>
            <Button size="lg" asChild className="mt-6">
              <Link href="/demo">
                Open the demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
