import type { Metadata } from "next";
import { ScreenshotToTestimonialClient } from "./client";
import { StructuredData } from "@/components/seo/structured-data";
import { toolBreadcrumbs } from "@/lib/seo-faqs";

export const metadata: Metadata = {
  title: "Screenshot → Testimonial — instantly turn any DM or tweet into proof",
  description:
    "Drop a screenshot of praise — DM, tweet, email, Slack, WhatsApp, review. We extract the quote, author, and source and turn it into a testimonial card. Free, no signup for your first try.",
  alternates: { canonical: "/tools/screenshot-to-testimonial" },
  openGraph: {
    title: "Turn any screenshot into a testimonial",
    description:
      "DMs, tweets, Slack praise, WhatsApp thank-yous — extracted and formatted as testimonials in 3 seconds.",
    url: "/tools/screenshot-to-testimonial",
  },
  robots: { index: true, follow: true },
};

export default function ScreenshotToTestimonialPage() {
  return (
    <>
      <StructuredData
        breadcrumbs={toolBreadcrumbs(
          "Screenshot to testimonial",
          "screenshot-to-testimonial",
        )}
      />
      <ScreenshotToTestimonialClient />
    </>
  );
}
