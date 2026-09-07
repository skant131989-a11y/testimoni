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
        "Both let you collect and embed testimonials. Testimoni's differentiator is the paste-a-URL flow: paste any tweet, LinkedIn post, Reddit thread, or Hacker News comment and get an approved testimonial in 30 seconds — no manual copy-paste of screenshots. Testimoni is also cheaper at $9/mo (vs Senja's $19) and offers native INR pricing at ₹499/mo.",
    },
    {
      question: "Is Testimoni actually free forever, unlike Senja?",
      answer:
        "Both have free plans. Testimoni's free plan: 10 testimonials, 1 form, 1 widget, hosted Wall of Love URL, one-line embed. Senja's free plan: similar limits but caps at 10 testimonials collected via forms only. Testimoni's paste-a-tweet works on the free plan too.",
    },
    {
      question: "Can I migrate from Senja to Testimoni?",
      answer:
        "Yes. Export your Senja testimonials as CSV, then import them into Testimoni (either via the paste-URL flow for social ones or the manual entry form). We're building a one-click Senja migrator — email hello@testimoni.io to be notified when it ships.",
    },
    {
      question: "Which is better for founders in India?",
      answer:
        "Testimoni offers native INR billing at ₹499/mo through Razorpay — no FX fees, GST-compliant invoices. Senja bills in USD only. If you're an Indian founder or agency serving Indian clients, Testimoni is 30-40% cheaper after FX + GST.",
    },
    {
      question: "Does Testimoni have video testimonials like Senja?",
      answer:
        "Yes. Every plan (including Free) includes 1 free video testimonial. Pro unlocks unlimited video, same as Senja Pro — but at less than half the price.",
    },
  ],

  vsTestimonialTo: [
    {
      question: "What's the difference between Testimoni and Testimonial.to?",
      answer:
        "Testimonial.to is primarily a video testimonial collection tool. Testimoni handles video AND text — plus a paste-a-URL flow that turns existing tweets/LinkedIn posts into testimonials in 30 seconds. Testimoni is also 50% cheaper ($9/mo vs Testimonial.to's starter tier) and offers native INR pricing.",
    },
    {
      question: "Which is faster to set up?",
      answer:
        "Testimoni's paste-a-URL demo works with zero signup — try it on the home page. Testimonial.to requires an account to try their form flow. First testimonial live in Testimoni: ~30 seconds. First testimonial in Testimonial.to: ~5-10 minutes.",
    },
    {
      question: "Which has better free plan?",
      answer:
        "Testimoni's free plan is more generous: 10 testimonials, 1 form, 1 widget, hosted Wall of Love URL, one-line embed, 1 video testimonial. Testimonial.to's free plan caps at 3 testimonials and 2 video responses.",
    },
    {
      question: "Can I embed Testimoni on Framer or Webflow like Testimonial.to?",
      answer:
        "Yes. Both offer one-line JavaScript embeds that work on Framer, Webflow, WordPress, Shopify, or any custom site. Testimoni uses Shadow DOM isolation to prevent CSS conflicts with your host site's styles.",
    },
    {
      question: "Which is better for solo founders on a budget?",
      answer:
        "Testimoni. Free forever plan does everything a solo founder needs at launch (10 testimonials, hosted wall, embed). If you outgrow it, Pro is $9/month with unlimited everything. Testimonial.to's paid tier starts higher and locks core features behind it.",
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

export function vsBreadcrumbs(competitor: string, slug: string) {
  return [
    { name: "Home", url: SITE_URL },
    { name: "Compare", url: `${SITE_URL}/vs` },
    { name: `Testimoni vs ${competitor}`, url: `${SITE_URL}/vs/${slug}` },
  ];
}
