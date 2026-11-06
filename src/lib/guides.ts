import { ALL_TOOLS, FACTS_NOTE } from "@/lib/competitors";

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
    note: `Read from each tool's own pricing page on ${FACTS_NOTE}. Plans change — check their sites before you buy. Famewall's $12/month Standard plan is the lowest-priced paid plan in this list.`,
  },
};

export const GUIDES: Guide[] = [
  {
    slug: "turn-tweets-into-testimonials",
    path: "/turn-tweets-into-testimonials",
    title: "Turn tweets into testimonials for your website",
    answer:
      "Testimoni turns a tweet into a website testimonial in about 30 seconds: paste the link to a public post on X, and it pulls the quote, name and photo into your Wall of Love or any widget. It is free for up to 15 testimonials, and Pro is $19/month for unlimited.",
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
      {
        heading: "What you get when you import a tweet",
        bullets: [
          "The quote as real text, so search engines, AI assistants and screen readers can read it.",
          "The author's name and profile photo, so the testimonial is attributed to a real person.",
          "The source link of the original post, which Testimoni keeps so the testimonial can be verified.",
          "An approval step, so you decide what goes on your wall.",
        ],
      },
      {
        heading: "Where to find the praise you already have",
        paragraphs: [
          "Most small products have more praise than they realise. Search X for your product name and for your domain, then check your LinkedIn notifications, your Product Hunt launch thread and any Reddit or Hacker News threads that mention you. Testimoni's free Customer Voice scan looks across X, Reddit and LinkedIn for what people say about you, so you can find posts worth importing.",
        ],
      },
      {
        heading: "A few good habits",
        bullets: [
          "Pick specific quotes over generic ones. \"Cut our onboarding from two days to two hours\" persuades more than \"great product\".",
          "Mix sources. A wall with posts from X, LinkedIn and a form looks more credible than one source repeated.",
          "Tell the author. A short reply or message saying you would like to feature their post is courteous, and it often earns a second testimonial.",
          "Put proof next to the decision: near your sign-up button and on your pricing page, not only on a separate page.",
        ],
      },
      {
        heading: "Free or Pro for this",
        paragraphs: [
          "The free plan imports tweets by URL and keeps up to 15 testimonials, with a hosted Wall of Love and a grid layout. Pro is $19/month flat: unlimited testimonials, all five layouts, no watermark and unlimited tweet drafts (the free plan gives 5 a month).",
        ],
      },
      priceTable,
    ],
    faqs: [
      {
        question: "How do I turn tweets that praise my product into testimonials on my website?",
        answer:
          "Copy the link to each public post on X that praises your product and paste it into Testimoni. It imports the quote, the author's name and photo as real text and keeps the link to the original post. You approve each one, then show them on a hosted Wall of Love or embed them on your site with one line of script. It is free for up to 15 testimonials.",
      },
      {
        question: "Is there a free way to turn tweets into testimonials?",
        answer:
          "Yes. Testimoni's free plan imports tweets by URL and keeps up to 15 testimonials, with a public Wall of Love.",
      },
      {
        question: "Can I import a tweet that someone else wrote about my product?",
        answer:
          "Yes. Paste the link to any public post that praises your product and Testimoni imports the quote, name and photo. Only publish praise that is about your product, keep the author's name with it, and where you can, let them know.",
      },
      {
        question: "Does Testimoni keep the link to the original tweet?",
        answer:
          "Yes. Each imported testimonial keeps the source link of the original post, and the Wall Score counts verified links back to the original post when it rates your wall.",
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
      "To show LinkedIn praise on your site, paste the link to a public LinkedIn post into Testimoni: it imports the quote, name and photo as a testimonial you can display in a widget or Wall of Love. Free for up to 15 testimonials; Pro is $19/month.",
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
      "Use a testimonial widget that is a script, not an iframe: Testimoni imports testimonials from links, forms and screenshots as real text, then shows them on your site with one line of script, so nothing is pasted or screenshotted by hand. The free plan includes a widget and a public Wall of Love; Pro ($19/month) adds every layout and unlimited widgets.",
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
        question: "Which tool embeds testimonials without an iframe or a screenshot?",
        answer:
          "Testimoni. Its widget is one script tag that renders the testimonials as real text in your page, inside a Shadow DOM so your site's CSS and the widget's CSS do not clash. There is no iframe and no image. Testimonials are imported from links, forms or screenshots as text, and the free plan includes the widget.",
      },
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
      {
        heading: "What a Wall of Love is",
        paragraphs: [
          "A Wall of Love is one page, or one section of your site, that gathers real praise from your customers in one place: tweets, LinkedIn posts, reviews, short quotes and videos, each with the person's name and photo. It works because visitors trust what other people say about you more than what you say about yourself.",
        ],
      },
      {
        heading: "What to put on it",
        bullets: [
          "Specific quotes about a result or a feeling, not just \"great product\".",
          "A mix of sources: X, LinkedIn, Product Hunt and a collection form, so it does not look like one friend repeated.",
          "Names and photos, so each quote belongs to a real person.",
          "Recent praise. A wall that stopped updating a year ago looks abandoned.",
          "A short video or two if you have them, since they stand out among text.",
        ],
      },
      {
        heading: "Where to show it",
        paragraphs: [
          "Use both. Share the hosted page when someone asks for proof, and embed the same wall on your homepage and pricing page, next to the sign-up button, where visitors are deciding. The embed is one line of script and works on WordPress, Webflow, Framer and React sites; the widget uses Shadow DOM so it does not clash with your site's CSS.",
        ],
      },
      {
        heading: "Free or Pro for a Wall of Love",
        paragraphs: [
          "The free plan gives you up to 15 testimonials, one collection form, one widget, a hosted Wall of Love and two videos, with the Grid layout and a small watermark. Pro is $19/month flat: unlimited testimonials, widgets, forms and videos, all five layouts, no watermark, plus Ask My Wall and the Wall Score audit.",
        ],
      },
      priceTable,
    ],
    faqs: [
      {
        question: "How do I build a Wall of Love from X (Twitter) posts?",
        answer:
          "Paste the link to each public post on X that praises you into Testimoni, which imports the quote, name and photo as text and keeps the link back to the original post. Approve the ones you want, choose a layout, then publish the hosted Wall of Love page or embed it on your site with one line of script. No manual copying or screenshots, and it is free for up to 15 testimonials.",
      },
      {
        question: "Do I need a developer?",
        answer: "No. The hosted page needs nothing, and the embed is one line.",
      },
      {
        question: "Is a Wall of Love free?",
        answer:
          "You can build one free with Testimoni: the free plan includes a hosted Wall of Love page for up to 15 testimonials. Pro removes the limit and the watermark.",
      },
      {
        question: "How many testimonials do I need on a Wall of Love?",
        answer:
          "There is no magic number. A handful of specific, recent quotes from different people and sources is more convincing than dozens of vague ones, and the Wall Score tells you what is missing.",
      },
      {
        question: "Can visitors ask questions about the reviews?",
        answer:
          'Yes: "Ask My Wall" answers visitors from your testimonials and names the customers it quotes. The free plan includes 30 answers a month; Pro has no limit.',
      },
    ],
    related: ["/turn-tweets-into-testimonials", "/embed-testimonials-without-screenshots", "/blog/best-testimonial-tools"],
  },
  {
    slug: "testimonial-widget-for-founders",
    path: "/testimonial-widget-for-founders",
    title: "Testimonial widget for solo founders on a budget",
    answer:
      "Testimoni is free for your first 15 testimonials, with a widget, a collection form, two video testimonials and a public Wall of Love. When you need more, Pro is $19/month for unlimited testimonials, widgets, videos and every layout.",
    sections: [
      {
        heading: "What you get free",
        bullets: [
          "Up to 15 testimonials",
          "1 collection form and 1 widget (Grid layout)",
          "2 video testimonials",
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
          "Yes. Testimoni's free plan includes one widget and a Wall of Love, for up to 15 testimonials.",
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
