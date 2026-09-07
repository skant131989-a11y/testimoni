import type { Metadata } from "next";
import { TestimonialWriterClient } from "./client";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS, toolBreadcrumbs } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

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
  return (
    <>
      {/* Per-page structured data — page-specific FAQPage + tool
          breadcrumbs so Google can surface expandable FAQ rich
          results for `testimonial generator` queries and render
          `Home › Tools › X` under the SERP link. */}
      <StructuredData
        faqs={[...PAGE_FAQS.testimonialWriter]}
        faqId={`${SITE_URL}/tools/testimonial-writer#faq`}
        breadcrumbs={toolBreadcrumbs(
          "Testimonial writer",
          "testimonial-writer"
        )}
      />
      <TestimonialWriterClient />
      <PageFAQ
        heading="Testimonial writer FAQ"
        subheading="Quick answers before you write your first one."
        faqs={PAGE_FAQS.testimonialWriter}
      />
    </>
  );
}
