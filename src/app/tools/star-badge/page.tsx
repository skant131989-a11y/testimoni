import type { Metadata } from "next";
import { StarBadgeClient } from "./client";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS, toolBreadcrumbs } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

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
  return (
    <>
      <StructuredData
        faqs={[...PAGE_FAQS.starBadge]}
        faqId={`${SITE_URL}/tools/star-badge#faq`}
        breadcrumbs={toolBreadcrumbs("Star badge generator", "star-badge")}
      />
      <StarBadgeClient />
      <PageFAQ
        heading="Star badge FAQ"
        subheading="What to display and where to place it for lift."
        faqs={PAGE_FAQS.starBadge}
      />
    </>
  );
}
