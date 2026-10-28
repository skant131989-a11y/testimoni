import { ALL_TOOLS, FACTS_VERIFIED_ON } from "@/lib/competitors";

/**
 * Question-led "answer pages". Each opens with the answer (what AI
 * assistants quote), then steps, then an FAQ that is also emitted as
 * FAQPage JSON-LD. Product facts must match the app (pricing, limits);
 * competitor numbers come only from src/lib/competitors.ts.
 */
export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
  table?: { headers: string[]; rows: string[][]; note?: string };
}

export interface Guide {
  slug: string;
  path: string;
  /** H1 and the <title>. */
  title: string;
  /** The answer paragraph; also the meta description. */
  answer: string;
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
  related: string[];
}

const priceTable: GuideSection = {
  heading: "How the free plans and first paid plans compare",
  table: {
    headers: ["Tool", "Free plan", "First paid plan"],
    rows: ALL_TOOLS.map((t) => [t.name, t.freePlan, t.firstPaidLabel]),
    note: `Read from each tool's own pricing page on ${FACTS_VERIFIED_ON}. Plans change — check their sites before you buy. Famewall's $12/month Standard plan is the lowest-priced paid plan in this list.`,
  },
};

export const GUIDES: Guide[] = [
  {
    slug: "turn-tweets-into-testimonials",
    path: "/turn-tweets-into-testimonials",
    title: "Turn tweets into testimonials for your website",
    answer:
      "Testimoni turns a tweet into a website testimonial in about 30 seconds: paste the link to a public post on X, and it pulls the quote, name and photo into your Wall of Love or any widget. It is free for up to 10 testimonials, and Pro is $19/month for unlimited.",
    sections: [
      {
        heading: "How it works",
        steps: [
          "Copy the link to the tweet (any public post on X).",
          "Paste it into Testimoni. The quote, author name and profile photo are imported.",
          "Approve it, then show it on your hosted Wall of Love or embed it on your site with one line of script.",
        ],
      },
      {
        heading: "Why not screenshots",
        paragraphs: [
          "A screenshot cannot be read by search engines, AI assistants or screen readers, and it looks stale fast. An imported tweet is real text on your page, keeps the author's name and photo, and fits your site's layout.",
        ],
      },
      {
        heading: "Works with more than X",
        paragraphs: [
          "Paste links from LinkedIn, Reddit, Hacker News and Product Hunt the same way. Praise that lives in DMs, Slack or WhatsApp? Upload a screenshot and Testimoni's AI pulls out the quote as text.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is there a free way to turn tweets into testimonials?",
        answer:
          "Yes. Testimoni's free plan imports tweets by URL and keeps up to 10 testimonials, with a public Wall of Love.",
      },
      {
        question: "Does it work on WordPress, Webflow or Framer?",
        answer:
          "Yes. You add one widget script to any of them, including React sites. The widget uses Shadow DOM so it won't clash with your site's CSS.",
      },
      {
        question: "Can I turn a testimonial back into a tweet?",
        answer:
          "Yes. Testimoni writes tweet-length drafts from any testimonial: 5 a month on the free plan, unlimited on Pro.",
      },
    ],
    related: ["/import-linkedin-recommendations", "/embed-testimonials-without-screenshots", "/wall-of-love"],
  },
  {
    slug: "import-linkedin-recommendations",
    path: "/import-linkedin-recommendations",
    title: "Collect LinkedIn praise and show it on your website",
    answer:
      "To show LinkedIn praise on your site, paste the link to a public LinkedIn post into Testimoni: it imports the quote, name and photo as a testimonial you can display in a widget or Wall of Love. Free for up to 10 testimonials; Pro is $19/month.",
    sections: [
      {
        heading: "Steps",
        steps: [
          "Open the LinkedIn post where someone praised you or your product and copy its link.",
          "Paste it into Testimoni.",
          "Approve it and choose where it shows: your Wall of Love, a carousel on your homepage, or a page-specific widget.",
        ],
      },
      {
        heading: "Find praise you missed",
        paragraphs: [
          "Testimoni's free website scan looks for public mentions of your site on X, LinkedIn, Reddit, Product Hunt, Hacker News and the wider web, and sorts them into praise, testimonials, complaints, feature requests, use cases and competitor mentions. You review what it finds before anything goes on your wall.",
        ],
      },
      {
        heading: "What about LinkedIn recommendations?",
        paragraphs: [
          "LinkedIn does not let tools export your profile recommendations automatically. If you have one you want to use, upload a screenshot and Testimoni's AI extracts the quote as text, or paste the link to any public post that praises you.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I import LinkedIn recommendations automatically?",
        answer:
          "Not automatically. You import public LinkedIn posts by pasting their link, or upload a screenshot of a recommendation. The website scan also finds new mentions for you to review.",
      },
      {
        question: "Does it keep the person's name and photo?",
        answer: "Yes, from the public post.",
      },
      {
        question: "Can I share a testimonial back to LinkedIn?",
        answer: "Yes. Pro has one-click compose to X and LinkedIn from any testimonial.",
      },
    ],
    related: ["/turn-tweets-into-testimonials", "/wall-of-love", "/testimonial-widget-for-founders"],
  },
  {
    slug: "embed-testimonials-without-screenshots",
    path: "/embed-testimonials-without-screenshots",
    title: "Embed customer testimonials without screenshots or copy-paste",
    answer:
      "Use a testimonial widget: Testimoni imports testimonials from links, forms and screenshots as real text, then shows them on your site with one line of script, so nothing is pasted or screenshotted by hand. The free plan includes a widget and a public Wall of Love; Pro ($19/month) adds every layout and unlimited widgets.",
    sections: [
      {
        heading: "Three ways in, none of them copy-paste",
        steps: [
          "Paste a link from X, LinkedIn, Reddit, Hacker News or Product Hunt.",
          "Send a form by email, WhatsApp, DM, QR code or an embed on your site. Customers leave text, a star rating or a video, and you approve it in one click.",
          "Upload a screenshot of a DM, Slack message, WhatsApp chat, App Store review or email. AI extracts the quote as text.",
        ],
      },
      {
        heading: "One line to embed",
        paragraphs: [
          "Add one script to WordPress, Webflow, Framer or a React app. Choose Grid (free), or Masonry, Carousel, List and Marquee on Pro. New testimonials appear without editing the page again.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why avoid screenshots?",
        answer:
          "Search engines and AI assistants cannot read text inside an image, and screenshots do not adapt to phone screens.",
      },
      {
        question: "Can I show different testimonials on different pages?",
        answer: "Yes, on Pro: each widget has its own selection of testimonials.",
      },
    ],
    related: ["/turn-tweets-into-testimonials", "/wall-of-love", "/testimonial-widget-for-founders"],
  },
  {
    slug: "wall-of-love",
    path: "/wall-of-love",
    title: "The easiest way to create a Wall of Love for your SaaS",
    answer:
      "The easiest way is to use a hosted Wall of Love: with Testimoni you collect praise from tweets, LinkedIn posts, forms and screenshots, and publish it on a public page at testimoni.io/w/… or embed it on your site, live in about 30 seconds. Free to start; Pro is $19/month.",
    sections: [
      {
        heading: "Build it in four steps",
        steps: [
          "Gather what you already have. Paste links to praise on X, LinkedIn, Product Hunt, Reddit or Hacker News, or run the website scan to find mentions you missed.",
          "Ask for more. Share a collection form. Customers can leave text, a rating or a short video.",
          "Pick a layout. Grid on the free plan; Masonry, Carousel, List or Marquee on Pro.",
          "Publish. Use the hosted page, or embed it with one line of script.",
        ],
      },
      {
        heading: "Make it convincing",
        paragraphs: [
          "Testimoni's Wall Score rates your wall from 0 to 100 on volume, diversity of sources, recency, video, verified links back to the original post, and ratings, and tells you what to add next.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need a developer?",
        answer: "No. The hosted page needs nothing, and the embed is one line.",
      },
      {
        question: "Can visitors ask questions about the reviews?",
        answer:
          'Yes, on Pro: "Ask My Wall" answers visitors from your testimonials and names the customers it quotes.',
      },
    ],
    related: ["/turn-tweets-into-testimonials", "/embed-testimonials-without-screenshots", "/blog/best-testimonial-tools"],
  },
  {
    slug: "testimonial-widget-for-founders",
    path: "/testimonial-widget-for-founders",
    title: "Testimonial widget for solo founders on a budget",
    answer:
      "Testimoni is free for your first 10 testimonials, with a widget, a collection form, one video testimonial and a public Wall of Love. When you need more, Pro is $19/month for unlimited testimonials, widgets, videos and every layout.",
    sections: [
      {
        heading: "What you get free",
        bullets: [
          "Up to 10 testimonials",
          "1 collection form and 1 widget (Grid layout)",
          "1 video testimonial",
          "Import from X, LinkedIn, Reddit, Hacker News and Product Hunt",
          "3 screenshot-to-testimonial extractions",
          "A public Wall of Love page",
        ],
      },
      {
        heading: "What Pro adds for $19/month",
        paragraphs: [
          'Unlimited testimonials, widgets, forms and videos; all five layouts; your branding with no "Powered by" mark; auto-sync from the App Store, Chrome Web Store, Play Store and Product Hunt; an analytics dashboard; an AI case study generator; and "Ask My Wall".',
        ],
      },
      priceTable,
      {
        heading: "Built for one-person teams",
        paragraphs: [
          "Set-up takes about 30 seconds and needs no code. Most founders start by pasting their best tweets and Product Hunt comments, which they already have.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is there a free testimonial widget?",
        answer:
          "Yes. Testimoni's free plan includes one widget and a Wall of Love, for up to 10 testimonials.",
      },
      {
        question: "Is there a yearly plan?",
        answer: "Not yet; Pro is monthly.",
      },
    ],
    related: ["/blog/best-testimonial-tools", "/vs/senja", "/vs/famewall"],
  },
];

export const GUIDE_LINKS = [
  ...GUIDES.map((g) => ({ href: g.path, label: g.title })),
  { href: "/blog/best-testimonial-tools", label: "The best testimonial tools in 2026, compared" },
];
