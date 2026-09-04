import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Image as ImageIcon, Search, PenLine, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Free testimonial tools — Testimoni",
  description:
    "Free tools for testimonials: card image generator, praise tweet finder, and testimonial writer. No signup needed.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Free testimonial tools — Testimoni",
    description:
      "Card generator, praise-tweet finder, and testimonial writer. All free, no signup.",
    url: "/tools",
  },
  robots: { index: true, follow: true },
};

const TOOLS = [
  {
    href: "/tools/testimonial-card",
    icon: ImageIcon,
    title: "Testimonial card generator",
    description:
      "Turn any customer quote into a shareable image for Twitter, LinkedIn, or Instagram. 4 themes, 3 formats, PNG download.",
    cta: "Make a card →",
  },
  {
    href: "/tools/praise-tweet-finder",
    icon: Search,
    title: "Praise tweet finder",
    description:
      "Find every tweet praising your brand in the last 90 days. Log in with X — we filter for positive-sentiment keywords.",
    cta: "Find mentions →",
  },
  {
    href: "/tools/testimonial-writer",
    icon: PenLine,
    title: "Testimonial writer",
    description:
      "Stuck writing a testimonial? Enter a name, what they did, and how it felt. Get 3 versions to choose from.",
    cta: "Write one →",
  },
] as const;

export default function ToolsPage() {
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
          <Link href="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-14">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> All free · No signup
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Free testimonial tools
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A small kit of free tools we built alongside the main Testimoni
            product. Use them without signing up.
          </p>
        </div>

        {/* Tools grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-2xl border-2 border-primary/10 bg-card p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <t.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="mt-4 text-lg font-bold">{t.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.description}
              </p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
                {t.cta}
              </p>
            </Link>
          ))}
        </div>

        {/* Upsell */}
        <div className="mt-16 rounded-2xl border-2 border-primary/30 bg-primary/5 p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-bold">
                Testimoni is the main product.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Collect testimonials from customers, host them at a shareable
                URL, and embed on your site with one line of code. Free plan
                includes 10 testimonials, 1 form, hosted wall.
              </p>
            </div>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to Testimoni
          </Link>
          <p>All tools free. No signup needed.</p>
        </div>
      </footer>
    </div>
  );
}
