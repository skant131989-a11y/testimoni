import type { Metadata } from "next";
import { RecommendationClient } from "./client";

export const metadata: Metadata = {
  title: "Free LinkedIn recommendation writer · Testimoni",
  description:
    "Write a LinkedIn recommendation in 30 seconds. Enter a name, role, and their strengths. Get 3 versions to choose from — skills-first, story-first, and character-first.",
  alternates: { canonical: "/tools/linkedin-recommendation" },
  openGraph: {
    title: "Free LinkedIn recommendation writer",
    description:
      "3 versions of a LinkedIn recommendation from a short brief. Free, no signup.",
    url: "/tools/linkedin-recommendation",
  },
  robots: { index: true, follow: true },
};

export default function LinkedinRecommendationPage() {
  return <RecommendationClient />;
}
