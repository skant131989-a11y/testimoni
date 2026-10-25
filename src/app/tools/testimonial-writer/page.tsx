import type { Metadata } from "next";
import { TestimonialWriterClient } from "./client";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS, toolBreadcrumbs } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export const metadata: Metadata = {
  title: "Free Testimonial Writer: Draft & Edit",
  description:
    "Draft a testimonial from real details about a customer's experience. Choose a tone and length, then review the wording with the customer before publishing. Free to try.",
  alternates: { canonical: "/tools/testimonial-writer" },
  openGraph: {
    title: "Free Testimonial Writer: Create a Draft to Review",
    description:
      "Turn details about a real customer experience into an editable testimonial draft. Review every claim with the customer before publishing.",
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
