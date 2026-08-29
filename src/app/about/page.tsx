import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Target, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "About Testimoni — Turn happy customers into social proof",
  description:
    "Testimoni is the fastest way for SaaS founders, coaches, and D2C brands to collect and embed customer testimonials. Built by a solo founder, shipping in public.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Testimoni",
    description:
      "Built for SaaS founders, coaches, and D2C brands who need social proof without the setup pain.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              About us
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Testimonials shouldn&apos;t be a project.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              We build the fastest way to turn happy customers into social proof
              — a collection form, an inbox, a widget, one line of code.
            </p>
          </div>

          <section className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold">Why we built Testimoni</h2>
            <p className="text-muted-foreground">
              Almost every SaaS founder we talked to had the same story: they knew
              testimonials were the single highest-ROI conversion lever on their site,
              but their homepage still had zero social proof six months in.
            </p>
            <p className="text-muted-foreground">
              The reason was never willingness. It was the mess in the middle —
              emailing customers, chasing screenshots, pasting into Google Docs,
              hand-coding HTML, keeping it in sync as testimonials come and go.
            </p>
            <p className="text-muted-foreground">
              Testimoni compresses that into three actions: <strong>share a link,
              approve what comes back, embed one script tag</strong>. Anywhere a
              customer submits — email, DM, QR code, iframe on a page — lands in
              the same inbox. You pick the good ones, drop them in a widget, and
              your site has a wall of love before the day is out.
            </p>
          </section>

          <section className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Ship in minutes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Set up your first form in under five minutes. Embed on any site with
                one line of code — no build steps, no CSS conflicts.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Curate per page</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                One library, unlimited widgets. Show different testimonials on your
                homepage, pricing page, and product pages from the same source.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Honest pricing</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Free plan works forever. Pro at $9/mo (₹859) unlocks unlimited
                everything. No sneaky per-seat fees, no lock-in, cancel anytime.
              </p>
            </div>
          </section>

          <section className="mt-16 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Shipping in public</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              We&apos;re building Testimoni transparently — every feature, every
              launch, every mistake. Follow the journey on X and LinkedIn, and
              tell us what to build next.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="/signup">
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/founders">Meet the founder</Link>
              </Button>
            </div>
          </section>
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
