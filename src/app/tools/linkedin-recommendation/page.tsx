import type { Metadata } from "next";
import { RecommendationClient } from "./client";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS, toolBreadcrumbs } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

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
  return (
    <>
      <StructuredData
        faqs={[...PAGE_FAQS.linkedinRecommendation]}
        faqId={`${SITE_URL}/tools/linkedin-recommendation#faq`}
        breadcrumbs={toolBreadcrumbs(
          "LinkedIn recommendation writer",
          "linkedin-recommendation"
        )}
      />
      <RecommendationClient />
      <PageFAQ
        heading="LinkedIn recommendation FAQ"
        subheading="How to write one that stands out."
        faqs={PAGE_FAQS.linkedinRecommendation}
      />
    </>
  );
}
