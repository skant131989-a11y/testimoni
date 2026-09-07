import type { Metadata } from "next";
import { PraiseTweetFinderClient } from "./client";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS, toolBreadcrumbs } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export const metadata: Metadata = {
  title: "Praise tweet finder — for founders, creators & freelancers · Testimoni",
  description:
    "Find praise tweets about your work — free, no X login. Enter your handle, we build a smart search on Google and X. Save the ones you like as testimonials.",
  alternates: { canonical: "/tools/praise-tweet-finder" },
  openGraph: {
    title: "Find praise tweets about your work — free tool",
    description:
      "No X login, no data stored. Enter your handle, we build a search on Google and X. Save the tweets you like as testimonials on your Wall of Love.",
    url: "/tools/praise-tweet-finder",
  },
  robots: { index: true, follow: true },
};

export default function PraiseTweetFinderPage() {
  return (
    <>
      <StructuredData
        faqs={[...PAGE_FAQS.praiseTweetFinder]}
        faqId={`${SITE_URL}/tools/praise-tweet-finder#faq`}
        breadcrumbs={toolBreadcrumbs(
          "Praise tweet finder",
          "praise-tweet-finder"
        )}
      />
      <PraiseTweetFinderClient />
      <PageFAQ
        heading="Praise tweet finder FAQ"
        subheading="How the search works and what happens after you find one."
        faqs={PAGE_FAQS.praiseTweetFinder}
      />
    </>
  );
}
