import type { Metadata } from "next";
import { BeautifierClient } from "./beautifier-client";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS, toolBreadcrumbs } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

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
  return (
    <>
      <StructuredData
        faqs={[...PAGE_FAQS.testimonialCard]}
        faqId={`${SITE_URL}/tools/testimonial-card#faq`}
        breadcrumbs={toolBreadcrumbs("Testimonial card maker", "testimonial-card")}
      />
      <BeautifierClient />
      <PageFAQ
        heading="Testimonial card FAQ"
        subheading="Everything about generating and sharing testimonial cards."
        faqs={PAGE_FAQS.testimonialCard}
      />
    </>
  );
}
