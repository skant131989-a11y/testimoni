import type { Metadata } from "next";
import { StarBadgeClient } from "./client";

export const metadata: Metadata = {
  title: "Free star rating badge generator · Testimoni",
  description:
    "Design a star rating badge for your website in 30 seconds. Pick colors, size, and style. Download SVG or copy embed code. Free, no signup.",
  alternates: { canonical: "/tools/star-badge" },
  openGraph: {
    title: "Free star rating badge generator",
    description:
      "Design a star rating badge. Download SVG or copy embed code. Free, no signup.",
    url: "/tools/star-badge",
  },
  robots: { index: true, follow: true },
};

export default function StarBadgePage() {
  return <StarBadgeClient />;
}
