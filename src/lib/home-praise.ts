const NEHA_WALL = "https://testimoni.io/w/cmtedlomj0009w0btzyi3yweh";

export interface HomePraise {
  content: string;
  customerName: string;
  sourceUrl: string;
  /** URL to the founder's Wall of Love — where "See all praise" links. */
  wallUrl: string;
  /** Display label for the wall — the workspace name, kept human. */
  wallName: string;
}

/**
 * Hardcoded real testimonials for the home page rotator ("Loved by
 * founders"). Bypasses a DB round-trip on every render — home page
 * stays statically renderable / <100ms application-code.
 *
 * When you have too many to hand-curate, promote this to a small
 * `/api/home-praise` endpoint or a build-time script that dumps the
 * top-N approved testimonials into this file. Until then, refresh
 * this list every few weeks from the actual walls.
 *
 * ONLY testimonials that praise Testimoni belong here. Cross-founder
 * love (Buildside, other tools) lives on /wall (Wall of Walls) —
 * that page has the framing for cross-workspace content; the home
 * page doesn't, and sending home traffic to a competing indie SaaS
 * tanks conversion.
 */
export const HOME_PRAISE: HomePraise[] = [
  {
    content:
      "Hi Neha, I was checking out your platform today, it's really good and clean and as a founder myself, it really removes the need to build a custom review database.",
    customerName: "Prince B",
    sourceUrl:
      "https://x.com/Princebuildsow/status/2095084813107835008?s=20",
    wallUrl: NEHA_WALL,
    wallName: "Testimoni",
  },
  {
    content:
      "No-login, paste-anywhere tools are exactly what gets used versus what gets bookmarked and forgotten. The praise tweet finder especially — most people have no idea how to actually go find their existing social proof.",
    customerName: "Josh Builds",
    sourceUrl: "https://x.com/Joshua_WD/status/2095894644487819346?s=20",
    wallUrl: NEHA_WALL,
    wallName: "Testimoni",
  },
  {
    content:
      "Shipping three free testimonial tools with no login is a clean unlock — the praise tweet finder especially is the part people usually gate behind a signup.",
    customerName: "Ali Mabsoute",
    sourceUrl: "https://x.com/alimabsoute/status/2095904783282434178?s=20",
    wallUrl: NEHA_WALL,
    wallName: "Testimoni",
  },
  {
    content:
      "Just tried it — that homepage-to-card speed holds up. No lag between paste and preview.",
    customerName: "octaviamotiondesigns",
    sourceUrl: "https://x.com/octaviamotion1/status/2096818332993458576?s=20",
    wallUrl: NEHA_WALL,
    wallName: "Testimoni",
  },
  {
    content: "Checked it out, love the attention to detail!",
    customerName: "Ali",
    sourceUrl: "https://x.com/HeyAliux/status/2094463550341402754?s=20",
    wallUrl: NEHA_WALL,
    wallName: "Testimoni",
  },
  {
    content: "That 30-second flow sounds super useful. Nice one.",
    customerName: "Mukund",
    sourceUrl: "https://x.com/mukparekh/status/2094402057734373876?s=20",
    wallUrl: NEHA_WALL,
    wallName: "Testimoni",
  },
  {
    content: "Cool this will save time from building that section.",
    customerName: "Shiva Khemka",
    sourceUrl: "https://x.com/shivak_01/status/2096183187257115135?s=20",
    wallUrl: NEHA_WALL,
    wallName: "Testimoni",
  },
  {
    content:
      "Tried @heynehasingh's Testimonials app, told her it had a problem — she shipped a fix within hours. Building in public done right.",
    customerName: "Uriel Bitton",
    sourceUrl: "https://x.com/uriel_builds/status/2096637894672748686?s=20",
    wallUrl: NEHA_WALL,
    wallName: "Testimoni",
  },
];

/**
 * Deterministic-per-day index — same UTC day = same pick. Prevents
 * flicker on refresh and lets the rotation feel curated rather than
 * random.
 */
export function pickDailyPraise(): HomePraise {
  const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return HOME_PRAISE[day % HOME_PRAISE.length];
}
