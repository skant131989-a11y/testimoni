import Link from "next/link";
import type { Metadata } from "next";
import {
  Home,
  Play,
  DollarSign,
  Mail,
  Search,
  ArrowRight,
  Ghost,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "404 — This page ghosted us · Testimoni",
  description:
    "The page you're looking for doesn't exist. But hey — while you're here, want to see if your customers are already praising you online?",
  robots: { index: false, follow: true },
};

const suggestions = [
  { href: "/", label: "Home", icon: Home },
  { href: "/features", label: "Features", icon: Search },
  { href: "/demo", label: "Live Demo", icon: Play },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/tools", label: "Free Tools", icon: Search },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="relative flex-1 overflow-hidden bg-gradient-to-br from-violet-100/70 via-purple-50 to-fuchsia-50/40">
        {/* Ambient blobs — same treatment as the home hero so the 404
            feels like part of the brand story, not a dead-end. */}
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center md:py-24">
          {/* Big 404 — the quote marks turn into eyes. Semantic joke: a
              testimonial tool's 404 IS a giant quote mark. */}
          <div
            aria-hidden="true"
            className="relative select-none font-bold leading-none text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(192, 132, 252) 50%, rgb(217, 70, 239) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              fontSize: "clamp(7rem, 20vw, 12rem)",
            }}
          >
            4<span className="inline-block px-1">&ldquo;</span>4
          </div>

          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-600/30 bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
            <Ghost className="h-3 w-3" /> This page ghosted us
          </div>

          {/* The "testimonial card" that IS the 404. Broken/faded on
              purpose — reads as a joke about missing praise. */}
          <div className="mt-10 w-full max-w-lg -rotate-1 rounded-3xl border-2 border-violet-200/70 bg-white/90 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur md:p-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
              #404 · missing quote
            </div>
            <p className="text-lg font-medium italic leading-relaxed text-slate-800 md:text-xl">
              &ldquo;This page ghosted us. Just like your happiest customers,
              before you asked them for a quote.&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3 border-t pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-sm font-bold text-white">
                ?
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">
                  A URL that no longer exists
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Formerly of testimoni.io
                </p>
              </div>
            </div>
          </div>

          {/* The pivot — a testimonial tool 404 should tie back to the
              product, not just apologise. Send lost visitors to the
              wedge. It's the free entry point most likely to convert. */}
          <div className="mt-12 max-w-xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">
              While you&rsquo;re here…{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                want to find your customer love?
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground md:text-lg">
              Paste your website — we scan X, Reddit, LinkedIn, Product Hunt,
              App Store, G2 & more for real praise about your product. Free,
              no signup, 30 seconds.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Link href="/tools/find-my-proof">
                  <Search className="mr-2 h-4 w-4" />
                  Find my customer love
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" /> Back to home
                </Link>
              </Button>
            </div>
          </div>

          {/* Small nav for the "actually I was looking for a real page"
              case. Compact chips to not compete with the hero pivot. */}
          <div className="mt-14">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Or head somewhere real
            </p>
            <nav className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-white/70 px-3 py-1.5 text-xs font-medium text-foreground transition hover:-translate-y-0.5 hover:border-violet-500/40 hover:bg-white hover:shadow-sm"
                >
                  <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {s.label}
                </Link>
              ))}
            </nav>
          </div>

          <p className="mt-10 text-xs text-muted-foreground">
            Think this URL should exist?{" "}
            <Link
              href="/contact"
              className="font-medium text-violet-700 underline-offset-4 hover:underline"
            >
              Tell us →
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t bg-white/50 py-8 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
