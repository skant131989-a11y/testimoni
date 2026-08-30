import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Star, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/letter-avatar";
import { InlineSignup } from "@/components/inline-signup";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Neha's Coaching — Wall of Love (sample)",
  description:
    "A sample Wall of Love, built with Testimoni. See what your own hosted wall could look like — real names, real quotes, one shareable URL.",
  alternates: { canonical: "/w/demo" },
  openGraph: {
    title: "Sample Wall of Love — Testimoni",
    description:
      "See a live example of a Testimoni Wall of Love. Free plan builds one just like this in minutes.",
    url: "/w/demo",
  },
};

const WORKSPACE = "Neha's Coaching";

const TESTIMONIALS: {
  id: string;
  content: string;
  rating: number;
  customerName: string;
  customerTitle: string;
}[] = [
  {
    id: "d1",
    content:
      "Neha's program completely rebuilt how I plan my week. I went from constantly feeling behind to shipping consistently — and finally taking Sundays off.",
    rating: 5,
    customerName: "Priya Menon",
    customerTitle: "Founder, LinenLab",
  },
  {
    id: "d2",
    content:
      "The frameworks are simple, but the coaching is the real unlock. Every session moved a stuck problem forward. Best money I've spent this year.",
    rating: 5,
    customerName: "Marcus Johnson",
    customerTitle: "Head of Growth, Northwind",
  },
  {
    id: "d3",
    content:
      "I signed one enterprise contract in month two — directly from the positioning we built together. Paid back the whole cohort several times over.",
    rating: 5,
    customerName: "Aditi Rao",
    customerTitle: "Solo consultant",
  },
  {
    id: "d4",
    content:
      "Warm, sharp, direct. Neha will tell you the thing you actually need to hear, then help you turn it into a plan you'll follow through on.",
    rating: 5,
    customerName: "Emily Rodriguez",
    customerTitle: "Product coach",
  },
  {
    id: "d5",
    content:
      "The weekly accountability was the thing that made it stick. I've done other programs — this is the first one I didn't quit halfway through.",
    rating: 5,
    customerName: "Jamal Wilson",
    customerTitle: "Course creator",
  },
  {
    id: "d6",
    content:
      "Practical, honest, no hype. I recommend Neha to every founder friend who tells me they're stuck.",
    rating: 5,
    customerName: "Sarah Chen",
    customerTitle: "CEO, LaunchPad",
  },
];

export default function DemoWallPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 via-background to-background">
      {/* Minimal top nav — only on the sample wall, not real customer walls.
          Lets marketing-page visitors jump to Log in / Get Started without
          bouncing back through history. */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="Testimoni logo"
            width={24}
            height={24}
            className="rounded-full"
            priority
          />
          <span className="font-semibold">Testimoni</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <TrackedLink cta="wall_demo_nav_login" surface="wall_demo" href="/login">Log in</TrackedLink>
          </Button>
          <Button size="sm" asChild>
            <TrackedLink cta="wall_demo_nav_signup" surface="wall_demo" href="/signup">Get Started Free</TrackedLink>
          </Button>
        </div>
      </nav>

      {/* Sample banner */}
      <div className="mt-4 bg-primary/10 py-2 text-center text-xs font-medium text-primary">
        <Sparkles className="mr-1 inline-block h-3 w-3" />
        Sample wall — built with Testimoni. Your own can look like this.
      </div>

      {/* Hero */}
      <header className="mx-auto max-w-5xl px-4 pt-16 pb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
          N
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Wall of Love
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          What clients are saying about{" "}
          <span className="font-semibold text-foreground">{WORKSPACE}</span>
        </p>
      </header>

      {/* Testimonials grid */}
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.id}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < t.rating
                        ? "h-5 w-5 fill-yellow-400 text-yellow-400"
                        : "h-5 w-5 fill-muted text-muted-foreground/30"
                    }
                  />
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-foreground">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3 pt-1">
                <LetterAvatar name={t.customerName} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {t.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.customerTitle}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Signup CTA — inline form, converts directly on the wall */}
        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:gap-8">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" /> Yours in 5 minutes
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">
                Want a Wall of Love like this?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Collect testimonials from your customers and share a page like
                this one in minutes. Your own URL, updates in real time as
                testimonials come in.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <li>✓ Free forever plan · no credit card</li>
                <li>✓ Public wall URL you can share today</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
            <InlineSignup source="wall_demo" idPrefix="wall-demo" />
          </div>
        </div>
      </main>

      {/* Watermark */}
      <footer className="border-t py-6">
        <p className="text-center text-sm text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Testimoni
          </Link>
        </p>
      </footer>
    </div>
  );
}
