import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/public-nav";
import { FindMyProofClient } from "./client";

export const metadata: Metadata = {
  title: "Find my customer proof — Testimoni",
  description:
    "Paste your website URL. Testimoni scans the public web for the customer love you already have — X, LinkedIn, Reddit, Product Hunt, App Store and more. No signup required.",
  alternates: { canonical: "/tools/find-my-proof" },
  openGraph: {
    title: "Find the customer love you already have — Testimoni",
    description:
      "Paste your website URL. We search X, LinkedIn, Reddit, Product Hunt, App Store and more for real customer praise about your product.",
    url: "/tools/find-my-proof",
  },
  robots: { index: true, follow: true },
};

/**
 * /tools/find-my-proof — the "wow" wedge experiment.
 *
 * One public-facing input, one big result. No signup needed to
 * try, because the whole point is: "you don't know we're
 * valuable until we show you value first."
 *
 * If 20-30 founders paste their URL and say "how did you find
 * this?", this becomes Testimoni's main pitch and the current
 * "collect testimonials" story becomes the second-order product.
 */

export default function FindMyProofPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        <FindMyProofClient />
      </main>
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni · An experiment. Tell us what you found:{" "}
          <a href="/contact" className="underline">
            hello@testimoni.io
          </a>
        </div>
      </footer>
    </div>
  );
}
