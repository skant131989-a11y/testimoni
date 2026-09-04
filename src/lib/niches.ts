/**
 * Job-shaped landing page config — one entry per /for/[niche] page.
 *
 * Each niche produces:
 *  - Its own H1 targeted at the audience's specific pain
 *  - 3 industry-flavored sample testimonial cards
 *  - Pain points spoken in the audience's own language
 *  - Same signup CTA / footer as the home
 *
 * Adding a new audience = one entry here. Deliberately not doorway
 * pages — every field is materially different per niche so search
 * engines see real unique content, not templated boilerplate.
 */

export interface Niche {
  slug: string;
  audience: string;
  title: string;
  description: string;
  h1: string;
  subline: string;
  painLine: string;
  outcomeLine: string;
  painPoints: string[];
  useCases: string[];
  samples: {
    name: string;
    role: string;
    quote: string;
    color: string;
    letter: string;
  }[];
  pillTagline: string;
}

export const NICHES: Niche[] = [
  {
    slug: "saas",
    audience: "SaaS founders",
    title: "Testimonials for SaaS landing pages · Testimoni",
    description:
      "Paste customer tweets, embed a Wall of Love, and turn dead pixels on your landing page into conversions. Free forever plan for indie SaaS founders.",
    h1: "Your SaaS landing page has no proof yet.",
    subline: "Fix it in 30 seconds — paste a praise tweet, embed one line.",
    painLine:
      "You built the product. You built the pricing page. The one thing missing is the wall of proof that turns tire-kickers into signups.",
    outcomeLine:
      "One line of JavaScript on your Next.js / Vercel / Framer site. Wall auto-refreshes when you approve new testimonials in the inbox.",
    pillTagline: "Built for indie SaaS · Free forever plan",
    painPoints: [
      "You have praise tweets from users but they're buried in your notifications",
      "No time to build a testimonials UI from scratch",
      "Competitors' landing pages look 10× more trustworthy",
    ],
    useCases: [
      "Wall of Love embed on your marketing site",
      "Widget on pricing page to lift conversion",
      "Public shareable wall URL in your Twitter bio",
    ],
    samples: [
      {
        name: "Alex Kim",
        role: "Solo SaaS founder",
        quote:
          "Pasted 12 user tweets in 20 minutes. My homepage bounce rate dropped from 71% to 54% the same week.",
        color: "bg-emerald-600",
        letter: "A",
      },
      {
        name: "Priya Menon",
        role: "Indie hacker · Analytics tool",
        quote:
          "The paste-a-tweet import saved me from screenshotting DMs into Figma. Widget is on my /pricing page now.",
        color: "bg-purple-600",
        letter: "P",
      },
      {
        name: "Marcus Johnson",
        role: "B2B SaaS founder",
        quote:
          "Free plan was enough to seed 8 testimonials from cold outreach replies. Upgraded when we hit 30.",
        color: "bg-blue-600",
        letter: "M",
      },
    ],
  },
  {
    slug: "course-creators",
    audience: "Course creators & coaches",
    title: "Testimonials for course creators & coaches · Testimoni",
    description:
      "Turn student wins into course sales. Collect testimonials via form, paste them from tweets, or upload short videos. Free forever plan for creators.",
    h1: "Turn student wins into course sales.",
    subline:
      "Collect testimonials from your cohort in a form. One click puts them on your sales page.",
    painLine:
      "Every cohort ends with 5-10 students posting wins in your Slack, DM, or Circle. Then those wins vanish. Meanwhile your sales page has one testimonial from 2023.",
    outcomeLine:
      "Send one form link at the end of every cohort. Approve submissions. Embed on your Kajabi / Teachable / Skool landing page.",
    pillTagline: "Built for course creators & coaches",
    painPoints: [
      "Student wins are trapped in your Slack, Circle, or DMs",
      "You have great video testimonials but nowhere to host them",
      "Your sales page uses the same 3 testimonials from last year",
    ],
    useCases: [
      "Post-cohort feedback form → auto-approved on your wall",
      "Video testimonials (MP4 up to 50MB) with inline player",
      "Testimonial page you can link from your welcome email",
    ],
    samples: [
      {
        name: "Sarah Chen",
        role: "Cohort-based course · Product design",
        quote:
          "End-of-cohort form is now automatic. 6 approved in the first 24h. Sales page went from 3 quotes to 25 in a month.",
        color: "bg-rose-600",
        letter: "S",
      },
      {
        name: "David Park",
        role: "1:1 coach · Product career",
        quote:
          "1 free video testimonial per plan was enough to add my first video review. Went from 'coming soon' to live in a weekend.",
        color: "bg-cyan-600",
        letter: "D",
      },
      {
        name: "Emily Rodriguez",
        role: "Notion course creator",
        quote:
          "Students fill the form after each cohort. Widget updates the same day I approve. My conversion doubled in month 2.",
        color: "bg-orange-600",
        letter: "E",
      },
    ],
  },
  {
    slug: "shopify",
    audience: "Shopify / D2C stores",
    title: "Testimonials for Shopify stores · Testimoni",
    description:
      "Post-delivery reviews as 5-star quotes on your product page. Embed on any Shopify theme with one line. Free forever plan for D2C shops.",
    h1: "Post-delivery reviews → live on your product page.",
    subline: "One form link. Approve in one click. Embed on any Shopify theme.",
    painLine:
      "Shopify's built-in reviews look generic. Every store has them. Your product page needs something that reads like humans, not stars from a stock template.",
    outcomeLine:
      "Send a form link in your post-delivery email. Approve the good ones. Embed a Wall of Love on your product page — text, video, and star ratings.",
    pillTagline: "Built for Shopify & D2C shops · Free forever",
    painPoints: [
      "Shopify's default review app looks the same on every store",
      "Post-delivery emails don't drive customers back to leave reviews",
      "Your product photos are great but there's zero social proof",
    ],
    useCases: [
      "Post-delivery form link (add via Klaviyo, Postscript, or Shopify Flow)",
      "Wall of Love embed on your product page (any theme)",
      "QR code on packaging for in-hand feedback capture",
    ],
    samples: [
      {
        name: "Aditi Rao",
        role: "D2C skincare brand · Shopify",
        quote:
          "Added the form to my Klaviyo post-delivery flow. 40+ testimonials in 3 weeks. Product pages finally have real voices.",
        color: "bg-orange-600",
        letter: "A",
      },
      {
        name: "Jamal Wilson",
        role: "Coffee subscription · D2C",
        quote:
          "QR code on the box was the unlock. Customers scan while unboxing. Real reviews, no app store install needed.",
        color: "bg-emerald-600",
        letter: "J",
      },
      {
        name: "Priya Menon",
        role: "Fashion label · Shopify Plus",
        quote:
          "One-line embed on our product template. Zero conflicts with our theme's CSS. Wall auto-refreshes on approve.",
        color: "bg-purple-600",
        letter: "P",
      },
    ],
  },
  {
    slug: "freelancers",
    audience: "Freelance designers, devs & writers",
    title: "Testimonials for freelancers · Testimoni",
    description:
      "Client testimonials on your portfolio site. Paste praise from Twitter/DMs, host a wall URL, embed on your site. Free forever plan for freelancers.",
    h1: "Your portfolio needs client proof.",
    subline: "Paste client tweets or DMs. Live on your site in 30 seconds.",
    painLine:
      "You have happy clients writing you praise in DMs, Slack, and email. None of it lives on your portfolio. Your next client can't see it.",
    outcomeLine:
      "Paste their tweet, forward their email into the form, or type it in manually. Approve. Live on your portfolio. Share the wall URL in your Twitter bio.",
    pillTagline: "For freelance designers, devs & writers",
    painPoints: [
      "Client praise is stuck in DMs, Slack, and email",
      "Your portfolio is your sales page but has no proof",
      "You feel awkward asking clients for testimonials",
    ],
    useCases: [
      "Wall URL in your bio: testimoni.io/w/yourname",
      "Embed on your portfolio landing page",
      "Pre-written WhatsApp / DM templates to ask past clients",
    ],
    samples: [
      {
        name: "Elena Costa",
        role: "Freelance product designer",
        quote:
          "Pasted 5 client tweets on Sunday. Booked 2 new clients from the portfolio next week. Correlation is real.",
        color: "bg-purple-600",
        letter: "E",
      },
      {
        name: "Kwame Osei",
        role: "Freelance developer · Remote",
        quote:
          "Wall URL in my Twitter bio. Every new lead now clicks through it. Way more warm intros than before.",
        color: "bg-blue-600",
        letter: "K",
      },
      {
        name: "Rina Patel",
        role: "Copywriter · Solo",
        quote:
          "The DM templates were the unlock — I hate asking. Now I copy-paste one message and 3 out of 5 clients respond.",
        color: "bg-rose-600",
        letter: "R",
      },
    ],
  },
  {
    slug: "agencies",
    audience: "Agencies with multiple client sites",
    title: "Testimonials for agencies · Testimoni",
    description:
      "One workspace, different widgets per client site. Embed a curated wall per client. Free forever plan; Pro unlocks unlimited widgets.",
    h1: "One workspace, different widgets per client.",
    subline:
      "Curate a testimonial wall for each client site. All from a single dashboard.",
    painLine:
      "You run 5 client sites. Each needs its own testimonials, its own colors, its own layout. Managing 5 separate accounts is a nightmare.",
    outcomeLine:
      "One Testimoni workspace. Create a widget per client. Curate which testimonials show on which site. Embed with one line each. Bill it back to the client.",
    pillTagline: "Built for agencies & studios",
    painPoints: [
      "Managing 5 client review accounts is painful",
      "Each client wants their own branding",
      "You need to swap testimonials between sites easily",
    ],
    useCases: [
      "One dashboard, per-client widget config",
      "Different testimonial curation per client site",
      "White-label with your own branding (Pro)",
    ],
    samples: [
      {
        name: "Emily Rodriguez",
        role: "Agency owner · 12 client sites",
        quote:
          "One workspace, 12 widgets, each themed for the client. No more juggling 12 accounts. Pro paid for itself in month one.",
        color: "bg-cyan-600",
        letter: "E",
      },
      {
        name: "David Park",
        role: "Web studio · Framer partner",
        quote:
          "Drop the embed in any Framer project. Client sees their wall update in real time as I approve. Feels magical.",
        color: "bg-blue-600",
        letter: "D",
      },
      {
        name: "Aditi Rao",
        role: "Boutique agency · Design + build",
        quote:
          "Client onboarding just got a new step: 'Let's set up your Wall of Love.' Every client now has one live.",
        color: "bg-purple-600",
        letter: "A",
      },
    ],
  },
  {
    slug: "photographers",
    audience: "Wedding & portrait photographers",
    title: "Testimonials for photographers · Testimoni",
    description:
      "Reviews from happy couples on your portfolio site. Paste Instagram DMs, add star ratings, embed on your booking page. Free forever plan.",
    h1: "Wedding & portrait reviews on your booking page.",
    subline:
      "Couples DM you praise. Turn it into proof that books your next shoot.",
    painLine:
      "You just delivered a wedding album. The couple sent you a heart-melting DM. That DM should be on your booking page — but it lives in Instagram forever.",
    outcomeLine:
      "Type the DM into the form (or paste it if they tagged you publicly). Approve. Live on your portfolio. Star ratings help your Google ranking too.",
    pillTagline: "For wedding & portrait photographers",
    painPoints: [
      "Client praise lives in Instagram DMs where no future client sees it",
      "Your booking page needs proof that you're the right fit",
      "You're a photographer, not a web developer",
    ],
    useCases: [
      "Embed on your booking / rate page",
      "Wall URL in your Instagram bio",
      "Video testimonial from the couple (1 free per plan)",
    ],
    samples: [
      {
        name: "Rina Patel",
        role: "Wedding photographer · Bay Area",
        quote:
          "Copied 8 couples' DMs into the form. Bookings for the next season went up 40%. Correlation → I'll take it.",
        color: "bg-rose-600",
        letter: "R",
      },
      {
        name: "Kwame Osei",
        role: "Portrait photographer · London",
        quote:
          "Star ratings on the wall lift my SEO. Google is now surfacing my booking page for 'portrait photographer London'.",
        color: "bg-emerald-600",
        letter: "K",
      },
      {
        name: "Elena Costa",
        role: "Event & wedding photographer",
        quote:
          "Uploaded one 45-second video review from a bride. That single video is now the first thing people watch on my page.",
        color: "bg-purple-600",
        letter: "E",
      },
    ],
  },
  {
    slug: "real-estate-agents",
    audience: "Real estate agents",
    title: "Testimonials for real estate agents · Testimoni",
    description:
      "Buyer & seller reviews on your listings page. Paste LinkedIn recommendations, host a wall URL, embed on your agent site. Free forever plan.",
    h1: "Buyers and sellers already recommend you.",
    subline:
      "Turn their LinkedIn recommendations into a live wall on your listings page.",
    painLine:
      "You closed 30 homes last year. Every buyer wrote you a glowing LinkedIn recommendation. Zero of those recommendations are on your agent site — where the next client actually decides.",
    outcomeLine:
      "Paste each LinkedIn recommendation URL — we import it. Or send a quick form link to past clients. Approve. Live on your listings page and your bio.",
    pillTagline: "For real estate agents & realtors",
    painPoints: [
      "LinkedIn recommendations are trapped on LinkedIn",
      "Zillow reviews don't tell the human story",
      "Your agent site looks like every other agent site",
    ],
    useCases: [
      "Embed on your listings page or agent bio",
      "Wall URL in email signature for buyers/sellers",
      "Video testimonial from a past client (1 free per plan)",
    ],
    samples: [
      {
        name: "Marcus Johnson",
        role: "Realtor · Austin, TX",
        quote:
          "Pasted 15 LinkedIn recommendations in an afternoon. Sellers now message me saying 'I read all your reviews first.'",
        color: "bg-blue-600",
        letter: "M",
      },
      {
        name: "Aditi Rao",
        role: "Broker · Mumbai",
        quote:
          "Wall URL in my WhatsApp status. Every prospect clicks through it before we meet. Warm intros only.",
        color: "bg-emerald-600",
        letter: "A",
      },
      {
        name: "Sarah Chen",
        role: "Luxury real estate · SoCal",
        quote:
          "The video testimonial slot changed everything. One 30s clip from a happy seller = more inquiries than my last 3 print ads.",
        color: "bg-rose-600",
        letter: "S",
      },
    ],
  },
  {
    slug: "wedding-vendors",
    audience: "Florists, venues, caterers & planners",
    title: "Testimonials for wedding vendors · Testimoni",
    description:
      "Reviews from couples and planners on your inquiry page. Perfect for florists, venues, caterers, and event planners. Free forever plan.",
    h1: "Reviews that book more weddings.",
    subline:
      "Florists, venues, caterers, planners — turn every happy couple into your next inquiry.",
    painLine:
      "Weddings are trust purchases. Couples spend a small fortune based on your Instagram and one WhatsApp call. Your inquiry page needs a wall of past couples saying 'yes, book them'.",
    outcomeLine:
      "Post-event form to every couple. Add star ratings. Embed on your inquiry page. Wall URL in your Instagram bio.",
    pillTagline: "For florists, venues, caterers & planners",
    painPoints: [
      "Post-event follow-up is inconsistent",
      "Couples praise you in DMs but never write it up publicly",
      "Your inquiry page competes on price, not proof",
    ],
    useCases: [
      "Post-event form link in your thank-you email",
      "Embed on your booking / inquiry page",
      "QR code at the reception for real-time reviews",
    ],
    samples: [
      {
        name: "Elena Costa",
        role: "Florist · Bay Area weddings",
        quote:
          "Post-event form → 8 five-star reviews the first month. Inquiries mention the reviews now. Booked out for the season.",
        color: "bg-rose-600",
        letter: "E",
      },
      {
        name: "Kwame Osei",
        role: "Wedding planner · Destination",
        quote:
          "Wall URL in every proposal PDF. Signed 3 destination weddings in a row because couples could see 20+ past couples endorse me.",
        color: "bg-cyan-600",
        letter: "K",
      },
      {
        name: "Rina Patel",
        role: "Boutique catering · South Asian weddings",
        quote:
          "QR code at the tasting session. Couples review right there. Widget on my site updates within the hour.",
        color: "bg-orange-600",
        letter: "R",
      },
    ],
  },
];

export function getNiche(slug: string): Niche | undefined {
  return NICHES.find((n) => n.slug === slug);
}
