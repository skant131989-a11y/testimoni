import type { Metadata } from "next";
import { AskTemplatesClient } from "./client";

export const metadata: Metadata = {
  title: "Free testimonial ask templates — WhatsApp, email, DM, LinkedIn · Testimoni",
  description:
    "Copy-paste templates for asking customers to leave a testimonial. Pick your channel (WhatsApp, email, DM, LinkedIn, SMS) + tone. Get 3 versions. Free, no signup.",
  alternates: { canonical: "/tools/ask-templates" },
  openGraph: {
    title: "Free templates for asking customers for testimonials",
    description:
      "WhatsApp, email, DM, LinkedIn, SMS. Pick your channel + tone. Get 3 ready-to-copy versions.",
    url: "/tools/ask-templates",
  },
  robots: { index: true, follow: true },
};

export default function AskTemplatesPage() {
  return <AskTemplatesClient />;
}
