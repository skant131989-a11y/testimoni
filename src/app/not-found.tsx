import Link from "next/link";
import type { Metadata } from "next";
import {
  Home,
  Play,
  DollarSign,
  BookOpen,
  Mail,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "This page doesn't exist. Head back home, try the demo, or start collecting testimonials free.",
  robots: { index: false, follow: true },
};

const suggestions = [
  { href: "/", label: "Home", icon: Home },
  { href: "/demo", label: "Live demo", icon: Play },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-primary">
            404 · Page not found
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            This page doesn&apos;t exist.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            It might have been moved, renamed, or never existed. Try one of
            these instead — or start collecting testimonials in 30 seconds
            with a free plan.
          </p>

          {/* Popular pages */}
          <nav className="mt-10 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <s.icon className="h-4 w-4 text-muted-foreground" />
                {s.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get started free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/w/demo">See a Sample Wall</Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Think this page should exist?{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              Tell us about it →
            </Link>
          </p>
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
