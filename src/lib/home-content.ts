import { COMPETITORS, FACTS_VERIFIED_ON } from "@/lib/competitors";

/**
 * Copy for the home page FAQ. One list feeds both the visible
 * accordion and the FAQPage JSON-LD, so what Google reads always
 * matches what visitors see.
 */

const senja = COMPETITORS.senja;
const testimonialTo = COMPETITORS["testimonial-to"];

export const HOME_FAQ: { question: string; answer: string }[] = [
  {
    question: "How does Find my praise work?",
    answer:
      "Paste your website. Testimoni searches public posts on X, LinkedIn, Reddit, Hacker News, Product Hunt and app stores that mention your product, shows you what it found, and you choose which ones to add. Nothing goes on your wall until you approve it.",
  },
  {
    question: "Is it really free?",
    answer:
      "Scanning is free and needs no signup. The free plan holds 10 testimonials, 1 collection form, 1 widget and a hosted Wall of Love page, with no credit card.",
  },
  {
    question: "What if nobody has posted about me yet?",
    answer:
      "Send your collection form to happy customers by email, WhatsApp, DM or QR code, and approve what comes back in one click. You can also drop a screenshot of a DM or review and let AI pull out the quote.",
  },
  {
    question: "Do imported testimonials credit the original author?",
    answer:
      "Yes. Every imported quote keeps the author's name and a link back to the original post. If you want explicit consent, send them the collection form instead.",
  },
  {
    question: "Where can I show my testimonials?",
    answer:
      "On a hosted Wall of Love link, or anywhere with one line of JavaScript: Framer, Webflow, WordPress, Shopify, Bubble or your own code. Choose from grid, masonry, carousel, list and marquee layouts.",
  },
  {
    question: "What does Pro add?",
    answer:
      "Unlimited testimonials, forms, widgets and video, all five layouts, no watermark, unlimited screenshot extraction, Ask My Wall, Wall Score and tweet drafts. It is a flat $19 a month, with no tiers.",
  },
  {
    question: "How is Testimoni different from Senja and Testimonial.to?",
    answer: `Both are mature tools. Testimoni is narrower and cheaper: it starts from praise that already exists on the web, and Pro is one flat $19 a month. Senja's paid plans start at $${senja.firstPaidUsd} a month and Testimonial.to's at $${testimonialTo.firstPaidUsd} (read from their pricing pages on ${FACTS_VERIFIED_ON}). If you need the broadest feature set, they may suit you better.`,
  },
];

export const SOURCES = [
  "X",
  "LinkedIn",
  "Reddit",
  "Hacker News",
  "Product Hunt",
  "App Store",
  "Google Play",
  "Chrome Web Store",
  "Blogs and review sites",
];
