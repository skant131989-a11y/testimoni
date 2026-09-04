import type { Metadata } from "next";
import { BeautifierClient } from "./beautifier-client";

export const metadata: Metadata = {
  title: "Free testimonial card generator — Testimoni",
  description:
    "Turn any customer quote into a beautiful shareable image for Twitter, LinkedIn, or Instagram. Free, no signup. Download as PNG in seconds.",
  alternates: { canonical: "/tools/testimonial-card" },
  openGraph: {
    title: "Free testimonial card generator",
    description:
      "Paste a customer quote, get a shareable image for Twitter, LinkedIn, or Instagram. Free, no signup.",
    url: "/tools/testimonial-card",
  },
  robots: { index: true, follow: true },
};

export default function TestimonialCardPage() {
  return <BeautifierClient />;
}
