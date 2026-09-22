import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/public-nav";
import { CustomerVoiceClient } from "./client";

export const metadata: Metadata = {
  title: "Find what customers really say — Testimoni",
  description:
    "Paste your website URL. Testimoni scans the public web and classifies every customer mention — praise, complaints, feature requests, use cases, testimonials, competitor mentions. No signup required to see what we find.",
  alternates: { canonical: "/tools/customer-voice" },
  openGraph: {
    title: "Find what customers really say about your product — Testimoni",
    description:
      "We scan X, LinkedIn, Reddit, Product Hunt and more, then classify every mention into praise, complaints, feature requests, use cases, testimonials, and competitor mentions.",
    url: "/tools/customer-voice",
  },
  robots: { index: true, follow: true },
};

export default function CustomerVoicePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        <CustomerVoiceClient />
      </main>
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni · Miss something?{" "}
          <a href="/contact" className="underline">
            hello@testimoni.io
          </a>
        </div>
      </footer>
    </div>
  );
}
