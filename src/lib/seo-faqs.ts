import type { StructuredData } from "@/components/seo/structured-data";

/**
 * Per-page FAQ + breadcrumb data for structured-data injection.
 *
 * Google surfaces FAQPage schema as expandable snippets in search
 * results — huge CTR win when the questions match the query intent.
 * Each slug here maps to one marketing page (tools + /vs comparisons).
 * The niche pages generate FAQs dynamically from niche.audience
 * inside for/[niche]/page.tsx — different pattern because 8 pages
 * share one template.
 *
 * Keep questions phrased like people actually search ("Is X free?"
 * not "Pricing details of X") — matches SERP query patterns better.
 */

// Match the shape StructuredData expects — inferred from its
// `faqs` prop so schema changes there flow through here.
export type SeoFaq = NonNullable<Parameters<typeof StructuredData>[0]>["faqs"] extends
  | ReadonlyArray<infer T>
  | undefined
  ? T
  : never;

// Per-page FAQ arrays. Keys match the page slug so pages can
// `import { PAGE_FAQS } from "@/lib/seo-faqs"; const faqs = PAGE_FAQS.testimonialWriter;`.
export const PAGE_FAQS = {
  testimonialWriter: [
    {
      question: "Is the testimonial writer really free?",
      answer:
        "Yes. Type what happened, get 3 testimonial versions instantly — no signup, no card, no watermark on the copy. Sign up if you want to save them to your Testimoni library and embed them on your site.",
    },
    {
      question: "How does the AI testimonial generator work?",
      answer:
        "You enter a customer's name, what they did with your product, and how it made them feel. We generate three tone-varied testimonial drafts (short, detailed, story-format) you can copy directly into any site or wall.",
    },
    {
      question: "Are the generated testimonials fake?",
      answer:
        "No — they're drafts. You provide the actual facts (who the customer is, what they did, how they felt), and the tool phrases them in different ways. Send the draft to your real customer for approval before publishing anywhere.",
    },
    {
      question: "Can I use these testimonials on my Framer or Webflow site?",
      answer:
        "Yes. Copy the generated testimonial into any tool. Or sign up for Testimoni (free) to embed a full Wall of Love on your Framer, Webflow, WordPress, Shopify, or React site with one line of JavaScript.",
    },
    {
      question: "What makes a good testimonial?",
      answer:
        "Specific outcomes over vague praise. 'This product saved me 4 hours a week on invoicing' beats 'Great product'. Real customer name and job title where possible. Genuine emotion (relief, delight, surprise) over marketing-speak.",
    },
  ],

  testimonialCard: [
    {
      question: "Is the testimonial card maker free?",
      answer:
        "Yes. Paste any tweet URL and download a beautiful testimonial card image — no signup, no watermark. Perfect for sharing praise on X, LinkedIn, Instagram, or in decks and email campaigns.",
    },
    {
      question: "What sizes and formats does the tool output?",
      answer:
        "PNG at 1:1 (square, best for Instagram / LinkedIn), 16:9 (landscape, best for X / Twitter and slide decks), and 9:16 (portrait, best for Instagram Stories / Reels).",
    },
    {
      question: "Can I customize the card colors and branding?",
      answer:
        "Yes. Pick from preset themes for free. Sign up to Testimoni Pro ($9/month) to use your brand colors, upload a logo, and remove the small 'Testimoni' watermark from the corner.",
    },
    {
      question: "Does the tool work with LinkedIn posts too?",
      answer:
        "Yes. Paste a public LinkedIn post URL and we'll generate the card the same way as tweets. Reddit, Hacker News, and Product Hunt URLs work after you sign up.",
    },
    {
      question: "Where should I share testimonial cards?",
      answer:
        "Bio pages (Linktree, Twitter, LinkedIn), sales decks, email signatures, product screenshots on your landing page, and the top of pricing pages. High-social-proof placement is more important than volume.",
    },
  ],

  praiseTweetFinder: [
    {
      question: "How does the tweet finder work?",
      answer:
        "Enter your Twitter handle, brand name, or product name. The tool surfaces recent public tweets mentioning you — filtered by positive sentiment — so you can turn them into testimonials in one click.",
    },
    {
      question: "Is it free to find praise tweets?",
      answer:
        "Yes. Search + preview is free without a signup. Sign up to Testimoni free to save the tweets you like into your workspace and embed them on your site.",
    },
    {
      question: "How far back does the search go?",
      answer:
        "Twitter's public search API returns tweets from roughly the last 7 days for free-tier searches. Sign up to Testimoni to auto-import new mentions weekly and never miss praise again.",
    },
    {
      question: "Can I turn a found tweet into an embeddable testimonial?",
      answer:
        "Yes. Click any tweet in the results, sign up for a free Testimoni workspace (10 testimonials on the free plan), and it's saved — plus you get a one-line embed to drop on your site.",
    },
    {
      question: "What's the difference between this and Twitter's built-in embed?",
      answer:
        "Twitter's embed shows a full tweet card with all the Twitter chrome (author avatar, actions, tweet URL). Testimoni cards show just the quote + name in your site's design language — cleaner, on-brand, no external branding.",
    },
  ],

  askTemplates: [
    {
      question: "How do you politely ask a customer for a testimonial?",
      answer:
        "Wait for a natural high point (they thanked you, gave positive feedback, or hit a milestone with your product). Use a short email or DM that names ONE specific thing they said or did, then ask for 2 sentences about their experience. Templates below cover 8 common scenarios.",
    },
    {
      question: "When is the best time to ask for a testimonial?",
      answer:
        "Within 24-48 hours of the customer expressing satisfaction (positive email, 5-star rating, successful renewal, or a specific outcome they achieved with your product). Momentum matters — the further from the good moment, the lower the response rate.",
    },
    {
      question: "What if the customer says yes but never sends the testimonial?",
      answer:
        "Send a Testimoni collection form link so they don't have to think about format. One field, star rating optional. Or paraphrase what they told you in an email and ask them to reply with 'looks good' — you write, they approve.",
    },
    {
      question: "Do I need to offer something in return?",
      answer:
        "Usually no — customers give testimonials to support people they like. If you do reciprocate, offer something small and non-monetary (early access to a feature, a shout-out, a physical thank-you card). Cash payments make the testimonial legally questionable in some jurisdictions.",
    },
    {
      question: "Can I use these templates for LinkedIn recommendations too?",
      answer:
        "Yes — the ask structure works for LinkedIn recommendations. See our LinkedIn recommendation generator for tailored templates that match LinkedIn's format and tone.",
    },
  ],

  linkedinRecommendation: [
    {
      question: "Is the LinkedIn recommendation generator free?",
      answer:
        "Yes. Enter the person's name, your relationship, and 2-3 things you want to highlight. The tool generates a polished LinkedIn recommendation draft in seconds — no signup required.",
    },
    {
      question: "How do I write a LinkedIn recommendation?",
      answer:
        "Start with how you know the person (worked with, managed by, or reported to). Give one specific example of their impact — a number, a project, an outcome. End with why you'd recommend them. Keep it 100-200 words, one paragraph.",
    },
    {
      question: "Is it OK to use an AI-generated LinkedIn recommendation?",
      answer:
        "Yes, as a starting draft — never verbatim. Personalize with real anecdotes only you would know. Recommendations that sound generic get skimmed and forgotten; specific ones stand out to hiring managers.",
    },
    {
      question: "How long should a LinkedIn recommendation be?",
      answer:
        "100-200 words is ideal. Long enough to include specifics, short enough to read fully. LinkedIn truncates recommendations after the first 3-4 lines in feeds, so lead with your strongest sentence.",
    },
    {
      question: "Can I use these for testimonials on my site too?",
      answer:
        "Yes. Sign up for a free Testimoni workspace, save your LinkedIn recommendations as testimonials, and embed them on your site with one line of JavaScript. Wall of Love URL included on every plan.",
    },
  ],

  starBadge: [
    {
      question: "How does the star badge generator work?",
      answer:
        "Pick your rating (e.g. 4.8 stars from 42 reviews), choose a style, download the SVG or PNG. Drop it into your site's header, product page, or email signature. Testimoni Pro connects it to a live rating that updates automatically.",
    },
    {
      question: "Are the badges free to use?",
      answer:
        "Yes. Generate and download unlimited static badges for free. Pro ($9/month) unlocks live badges that pull your actual Testimoni rating in real time — so the number updates without you touching code.",
    },
    {
      question: "Do star badges actually improve conversions?",
      answer:
        "Yes, when placed near CTAs. Baymard Institute research shows visible ratings on product pages lift add-to-cart rates by 4-15% depending on category. Keep it above the fold, near the primary button.",
    },
    {
      question: "What star badge styles are supported?",
      answer:
        "G2-style pill, Trustpilot-style bar, minimalist inline stars, and card variants. Customize colors and background. Pro users can add their logo alongside.",
    },
    {
      question: "Where should I place a star badge on my site?",
      answer:
        "Near the primary CTA on your home page hero, above the pricing tiers on your pricing page, in the header of high-intent product pages, and in your email signature. Avoid low-visibility placements like the footer.",
    },
  ],

  vsSenja: [
    {
      question: "What's the biggest difference between Testimoni and Senja?",
      answer:
        "Both let you collect and embed testimonials. Testimoni is built around a paste-a-URL flow: paste a tweet or LinkedIn post and get an approved testimonial in about 30 seconds. Testimoni Pro is $9/mo, with native INR pricing at ₹499/mo. Senja describes importing from 30+ platforms or a CSV — check senja.io for their current features and pricing.",
    },
    {
      question: "Is Testimoni actually free forever, unlike Senja?",
      answer:
        "Both have free plans. Testimoni's free plan: 10 testimonials, 1 form, 1 widget, hosted Wall of Love URL, one-line embed, and the paste-a-tweet flow. See senja.io for what their free plan currently includes.",
    },
    {
      question: "Can I migrate from Senja to Testimoni?",
      answer:
        "Yes. Export your Senja testimonials as CSV, then import them into Testimoni (either via the paste-URL flow for social ones or the manual entry form). We're building a one-click Senja migrator — email hello@testimoni.io to be notified when it ships.",
    },
    {
      question: "Which is better for founders in India?",
      answer:
        "Testimoni offers native INR billing at ₹499/mo through Razorpay, so there are no currency-conversion fees on your card. If you're an Indian founder or agency serving Indian clients, compare that with what you'd pay in USD after conversion and GST on any other tool.",
    },
    {
      question: "Does Testimoni have video testimonials like Senja?",
      answer:
        "Yes. Every Testimoni plan (including Free) includes 1 video testimonial, and Pro unlocks unlimited video. Senja also collects video and text testimonials.",
    },
  ],

  vsTestimonialTo: [
    {
      question: "What's the difference between Testimoni and Testimonial.to?",
      answer:
        "Testimonial.to describes itself as an all-in-one platform for testimonials, case studies, NPS and brand monitoring, and it collects video and text testimonials. Testimoni is focused on testimonials and social proof, handling video AND text — plus a paste-a-URL flow that turns existing tweets and LinkedIn posts into testimonials in about 30 seconds. Testimoni Pro is $9/month, with native INR pricing (₹499/month). Check Testimonial.to's site for their current pricing.",
    },
    {
      question: "Which is faster to set up?",
      answer:
        "With Testimoni, the paste-a-URL demo on the home page works with zero signup, and a first testimonial takes about 30 seconds. Try both and see which fits how you work.",
    },
    {
      question: "What does Testimoni's free plan include?",
      answer:
        "10 testimonials, 1 collection form, 1 widget, a hosted Wall of Love URL, the one-line embed, and 1 video testimonial. Compare that with Testimonial.to's current free plan on their site.",
    },
    {
      question: "Can I embed Testimoni on Framer or Webflow like Testimonial.to?",
      answer:
        "Yes. Testimoni's one-line embed works on Framer, Webflow, WordPress, Shopify, or any custom site, and uses Shadow DOM isolation to prevent CSS conflicts with your host site's styles. Testimonial.to also embeds with a short snippet of HTML.",
    },
    {
      question: "Which is better for solo founders on a budget?",
      answer:
        "Testimoni's free plan covers what a solo founder needs at launch (10 testimonials, hosted wall, embed), and Pro is $9/month if you outgrow it. Compare against Testimonial.to's current plans and pick the one that fits your budget and use case.",
    },
  ],

  testimonialWidget: [
    {
      question: "What is a testimonial widget?",
      answer:
        "A testimonial widget is a block you embed on your website that displays customer testimonials — quotes, ratings, and photos — so visitors see social proof right where they decide. Testimoni's widget pulls from your testimonial library and can auto-add testimonials the moment you approve them.",
    },
    {
      question: "How do I add a testimonial widget to my website?",
      answer:
        "Add your testimonials, pick a layout, then paste one script tag — <script src=\"https://testimoni.io/embed/widget.js\" data-widget-id=\"YOUR_WIDGET_ID\"></script> — into your page. It works on Framer, Webflow, WordPress, Shopify, Bubble, React, Vue, Next.js, or plain HTML.",
    },
    {
      question: "Is the testimonial widget free?",
      answer:
        "Yes. The free plan includes 10 testimonials, 1 collection form, 1 widget, a hosted Wall of Love page and the one-line embed, with no credit card. Pro is $9/month (₹499/month in India) for higher limits.",
    },
    {
      question: "Will the widget break my site's design?",
      answer:
        "No. The widget renders inside a Shadow DOM, so its styles can't leak into your page and your page's CSS can't break the widget.",
    },
    {
      question: "Which widget layouts are available?",
      answer:
        "Five: Grid, Masonry, Carousel, List and Marquee. You can switch layouts without re-adding testimonials.",
    },
    {
      question: "Can the widget show video testimonials?",
      answer:
        "Yes. Every plan, including Free, includes 1 video testimonial; Pro unlocks unlimited video.",
    },
  ],

  howToWriteTestimonial: [
    {
      question: "How long should a testimonial be?",
      answer:
        "Usually two to three sentences. Long enough to name the problem and the result, short enough that a visitor reads it in a few seconds. If a customer sends a long story, pull out the one or two most specific sentences and get their approval to shorten it.",
    },
    {
      question: "What is the difference between a testimonial and a review?",
      answer:
        "A testimonial is a statement from a customer about their experience that a business collects and shares on its own site or marketing. A review is usually written on a third-party platform where the business doesn't control the wording. Both are social proof; testimonials are easier to curate.",
    },
    {
      question: "Can I write a testimonial for my own product?",
      answer:
        "Don't invent one. A testimonial should come from a real customer, in their words, with their permission. You can help a happy customer get started by giving them prompts or a draft to edit, but they should approve it, and it should be true.",
    },
    {
      question: "How do I ask a customer for a testimonial?",
      answer:
        "Ask right after a good moment, such as a result or a compliment, make it one click to answer, and give two or three prompts so they aren't facing a blank box. Testimoni's free ask templates and testimonial writer help with both.",
    },
  ],

  vsIndex: [
    {
      question: "What should I compare when choosing a testimonial tool?",
      answer:
        "Five things: free-plan limits (testimonials, forms, widgets), whether you get a hosted wall page, how you can import existing praise (forms only, or also social URLs), how the embed works and whether it can conflict with your site's CSS, and pricing in your currency.",
    },
    {
      question: "How is Testimoni different from other testimonial tools?",
      answer:
        "You can paste an X or LinkedIn URL and get an approved testimonial in about 30 seconds, every workspace gets a hosted Wall of Love URL on the free plan, and Pro is $9/month with native INR billing (₹499/month) for Indian teams.",
    },
    {
      question: "Where can I see detailed comparisons?",
      answer:
        "Testimoni vs Senja and Testimoni vs Testimonial.to each have a feature-by-feature table and an honest 'pick them if…' section.",
    },
  ],
} as const;

// Breadcrumbs for each page — keeps the SERP link showing
// `Home › Tools › X` instead of just the URL.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export function toolBreadcrumbs(name: string, slug: string) {
  return [
    { name: "Home", url: SITE_URL },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name, url: `${SITE_URL}/tools/${slug}` },
  ];
}

export function pageBreadcrumbs(name: string, path: string) {
  return [
    { name: "Home", url: SITE_URL },
    { name, url: `${SITE_URL}${path}` },
  ];
}

export function vsBreadcrumbs(competitor: string, slug: string) {
  return [
    { name: "Home", url: SITE_URL },
    { name: "Compare", url: `${SITE_URL}/vs` },
    { name: `Testimoni vs ${competitor}`, url: `${SITE_URL}/vs/${slug}` },
  ];
}
