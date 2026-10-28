/**
 * Competitor facts used by the comparison pages, "best testimonial
 * tools" article and the guides. Everything here was read from each
 * tool's own pricing page and must stay that way — update
 * FACTS_VERIFIED_ON whenever you re-check. Never add a claim you can't
 * point to on their site.
 */
export const FACTS_VERIFIED_ON = "28 Oct 2026";

export interface Tool {
  slug: string;
  name: string;
  url: string;
  pricingUrl: string;
  /** One line, in their own terms. */
  summary: string;
  freePlan: string;
  /** Cheapest paid plan, USD per month billed monthly, for sorting/tables. */
  firstPaidUsd: number;
  firstPaidLabel: string;
  otherPaid: string;
  strengths: string[];
  chooseIf: string[];
}

export const TESTIMONI: Tool = {
  slug: "testimoni",
  name: "Testimoni",
  url: "https://testimoni.io",
  pricingUrl: "https://testimoni.io/pricing",
  summary:
    "A testimonial tool for solo founders and small SaaS teams: paste a tweet or LinkedIn post URL and get an attributed testimonial, then show it as a hosted Wall of Love or a one-line embed.",
  freePlan:
    "10 testimonials, 1 collection form, 1 widget, hosted Wall of Love page, one-line embed (grid layout, small watermark)",
  firstPaidUsd: 19,
  firstPaidLabel: "Pro, $19/month flat",
  otherPaid: "One paid plan — no tiers",
  strengths: [
    "Paste an X or LinkedIn URL and get an approved testimonial in about 30 seconds",
    "Hosted Wall of Love URL on the free plan",
    "One flat $19/month plan: unlimited testimonials, all five layouts, no watermark, AI features included",
    "Free Customer Voice scan of what people say about you on X, Reddit and LinkedIn",
  ],
  chooseIf: [
    "You want the quickest way to turn praise that already exists on X or LinkedIn into testimonials",
    "You want one simple price rather than tiers",
    "You're a solo founder or small SaaS team",
  ],
};

export const COMPETITORS: Record<string, Tool> = {
  senja: {
    slug: "senja",
    name: "Senja",
    url: "https://senja.io",
    pricingUrl: "https://senja.io/pricing",
    summary:
      "A testimonial platform for collecting video and text testimonials, importing from many platforms, and showing them in widgets and Walls of Love.",
    freePlan:
      "15 video and text testimonials, collection form, import from social and review platforms, unlimited widgets and Walls of Love",
    firstPaidUsd: 29,
    firstPaidLabel: "Starter, $29/month",
    otherPaid: "Pro, $59/month",
    strengths: [
      "More free testimonials (15) than most",
      "Case-study generation, thank-you gifts, reels and testimonial analysis",
      "API, webhooks and Zapier on paid plans",
    ],
    chooseIf: [
      "You want the broadest feature set and don't mind paying $29–$59/month",
      "You collect a lot of video testimonials and want to repurpose them",
    ],
  },
  famewall: {
    slug: "famewall",
    name: "Famewall",
    url: "https://famewall.io",
    pricingUrl: "https://famewall.io/pricing",
    summary:
      "A testimonial tool for building walls of testimonials, with collection pages, video and audio testimonials, and widgets.",
    freePlan: "10 testimonials, 1 published wall, 1 collection page, 1 video and 1 audio testimonial",
    firstPaidUsd: 12,
    firstPaidLabel: "Standard, $12/month",
    otherPaid: "Professional $25, Business $80, Agency $125 per month",
    strengths: [
      "The lowest-priced paid plan here ($12/month)",
      "Several published walls and collection pages on paid plans",
      "Video and audio testimonials, translation, custom domains, Zapier and API",
    ],
    chooseIf: [
      "Price is your top concern and $12/month fits",
      "You need multiple walls or collection pages for different products or clients",
    ],
  },
  "testimonial-to": {
    slug: "testimonial-to",
    name: "Testimonial.to",
    url: "https://testimonial.to",
    pricingUrl: "https://testimonial.to/pricing",
    summary:
      "A testimonial platform for collecting text and video testimonials, with a public testimonial page and Wall of Love widgets.",
    freePlan:
      "Unlimited X and LinkedIn imports, 10 text + 2 video testimonials in total, public testimonial page, Wall of Love widgets",
    firstPaidUsd: 25,
    firstPaidLabel: "Starter, $25/month",
    otherPaid: "Ultimate $50, Ultimate+ $95 per month per space",
    strengths: [
      "Free plan includes unlimited X and LinkedIn imports",
      "Higher tiers add brand monitoring, NPS surveys, API/MCP and SOC 2",
      "7-day free trial on paid plans",
    ],
    chooseIf: [
      "You want a more complete platform (surveys, monitoring, case studies) and can pay $25–$95/month",
    ],
  },
  shapo: {
    slug: "shapo",
    name: "Shapo",
    url: "https://shapo.io",
    pricingUrl: "https://shapo.io/pricing",
    summary:
      "A tool for collecting and showing testimonials and customer reviews, with many review-widget styles, forms and surveys.",
    freePlan:
      "Up to 15 testimonials, unlimited widgets and forms, your own Wall of Love, video and image testimonials, Shapo branding",
    firstPaidUsd: 29,
    firstPaidLabel: "Pro, $29/month ($1 for a 7-day trial)",
    otherPaid: "One paid plan",
    strengths: [
      "15 free testimonials with unlimited widgets and forms",
      "Many review-widget styles, including Google reviews widgets",
      "Surveys with AI insights on Pro",
    ],
    chooseIf: [
      "You want lots of widget styles or need to show Google reviews alongside testimonials",
    ],
  },
};

export const ALL_TOOLS: Tool[] = [TESTIMONI, ...Object.values(COMPETITORS)];
