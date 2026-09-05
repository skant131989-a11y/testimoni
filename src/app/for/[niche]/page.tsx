import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NICHES, getNiche } from "@/lib/niches";
import { InlineSignup } from "@/components/inline-signup";
import { TrackedLink } from "@/components/tracked-link";
import { ExitIntent } from "@/components/exit-intent";

interface PageProps {
  params: Promise<{ niche: string }>;
}

// Statically generate all niche pages at build time
export function generateStaticParams() {
  return NICHES.map((n) => ({ niche: n.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { niche: slug } = await params;
  const niche = getNiche(slug);
  if (!niche) return { title: "Not found · Testimoni" };
  return {
    title: niche.title,
    description: niche.description,
    alternates: { canonical: `/for/${niche.slug}` },
    openGraph: {
      title: niche.title,
      description: niche.description,
      url: `/for/${niche.slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function NichePage({ params }: PageProps) {
  const { niche: slug } = await params;
  const niche = getNiche(slug);
  if (!niche) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={28}
              height={28}
              className="rounded-full"
            />
            <span className="text-xl font-bold">Testimoni</span>
          </Link>
          <TrackedLink cta="niche_header_signup" surface={`for_${niche.slug}`} href="/signup">
            <Button size="sm">Start free</Button>
          </TrackedLink>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {niche.pillTagline}
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          {niche.h1}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          {niche.subline}
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <TrackedLink
            cta="niche_hero_signup"
            surface={`for_${niche.slug}`}
            href="/signup"
          >
            <Button size="lg" className="gap-2">
              Start free — 30 seconds <ArrowRight className="h-4 w-4" />
            </Button>
          </TrackedLink>
          <TrackedLink
            cta="niche_hero_demo"
            surface={`for_${niche.slug}`}
            href="/w/demo"
            className="text-sm font-medium text-primary hover:underline"
          >
            or see a live wall →
          </TrackedLink>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["Free forever", "No credit card", "Live in ~30s"].map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {chip}
            </span>
          ))}
        </div>
      </section>

      {/* Pain / Outcome pair */}
      <section className="border-y bg-muted/20 py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-6">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive">
                The problem
              </div>
              <p className="text-base leading-relaxed text-foreground">
                {niche.painLine}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {niche.painPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/40" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                What Testimoni does
              </div>
              <p className="text-base leading-relaxed text-foreground">
                {niche.outcomeLine}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {niche.useCases.map((u) => (
                  <li key={u} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sample wall */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              ✨ Illustrative — this is what yours could look like
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              What a wall for {niche.audience.toLowerCase()} looks like
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Cards below are illustrative — not real customers. Yours renders
              the same way with your own testimonials.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {niche.samples.map((s, i) => (
              <div
                key={`${s.name}-${i}`}
                className="flex flex-col rounded-xl border bg-card p-5 shadow-sm"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                  &ldquo;{s.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${s.color}`}
                  >
                    {s.letter}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm">
            <TrackedLink
              cta="niche_wall_demo"
              surface={`for_${niche.slug}`}
              href="/w/demo"
              className="font-medium text-primary hover:underline"
            >
              See a full live Wall of Love →
            </TrackedLink>
          </p>
        </div>
      </section>

      {/* Ask · Collect · Publish */}
      <section className="border-y bg-primary/[0.03] py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                num: "1",
                title: "Ask",
                body: "Send one link — form, QR, WhatsApp, DM, or paste a customer's tweet.",
              },
              {
                num: "2",
                title: "Collect",
                body: "Text, ratings, and video all land in one approval inbox.",
              },
              {
                num: "3",
                title: "Publish",
                body: "Embed on your site or share a free hosted wall URL.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.num}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA + signup */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:gap-10">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Zap className="h-3 w-3" /> {niche.pillTagline}
              </div>
              <h2 className="text-3xl font-bold">
                Get your first testimonial live today.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Free forever plan. No credit card. Set up in 30 seconds.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li>✓ 10 testimonials, 1 form, 1 widget on the Free plan</li>
                <li>✓ Public Wall of Love URL — shareable anywhere</li>
                <li>✓ One-line embed for any site</li>
              </ul>
            </div>
            <InlineSignup
              source={`for_${niche.slug}`}
              idPrefix={`for-${niche.slug}`}
            />
          </div>
        </div>
      </section>

      {/* Cross-niche footer — helps discovery of the other pages */}
      <section className="border-t bg-muted/20 py-10">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Also built for
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {NICHES.filter((n) => n.slug !== niche.slug).map((other) => (
              <Link
                key={other.slug}
                href={`/for/${other.slug}`}
                className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                {other.audience}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Standard footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to Testimoni
          </Link>
          <p>© 2026 Testimoni. All rights reserved.</p>
        </div>
      </footer>

      <ExitIntent
        surface={`for_${niche.slug}`}
        headline={`Wait — build a Wall of Love for ${niche.audience.toLowerCase()}.`}
      />
    </div>
  );
}
