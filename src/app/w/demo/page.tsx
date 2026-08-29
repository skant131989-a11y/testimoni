import Link from "next/link";
import type { Metadata } from "next";
import { Star, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/letter-avatar";

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
      {/* Sample banner */}
      <div className="bg-primary/10 py-2 text-center text-xs font-medium text-primary">
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

        {/* Signup CTA */}
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold">
            Want a Wall of Love like this?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Collect testimonials from your customers and share a page like this
            one in minutes. Free forever plan.
          </p>
          <Button size="lg" asChild className="mt-6">
            <Link href="/signup">
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card. Set up in 5 minutes.
          </p>
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
