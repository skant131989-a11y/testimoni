import type { Metadata } from "next";
import { TestimonialWriterClient } from "./client";

export const metadata: Metadata = {
  title: "Free testimonial writer — Testimoni",
  description:
    "Struggling to write a testimonial? Enter a name, what they did, and how it made you feel. We'll generate 3 versions to choose from. Free, no signup.",
  alternates: { canonical: "/tools/testimonial-writer" },
  openGraph: {
    title: "Free testimonial writer — 3 versions in 5 seconds",
    description:
      "Type what someone did. Get 3 testimonial variations. Free, no signup, ready to copy.",
    url: "/tools/testimonial-writer",
  },
  robots: { index: true, follow: true },
};

export default function TestimonialWriterPage() {
  return <TestimonialWriterClient />;
}
