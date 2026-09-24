import { prisma } from "@/lib/prisma";

/**
 * Testimoni's own real customer proof, for when someone scans
 * testimoni.io in Find My Proof or Customer Voice.
 *
 * Neither Tavily nor web search finds much for our own brand, so
 * instead of returning nothing we return the testimonials on our own
 * wall — but ONLY the ones that carry a source link, i.e. real posts
 * someone actually made and we imported. Anything without a source is
 * never shown as search evidence.
 */

const OWN_HOSTS = new Set(["testimoni.io"]);
const OWN_WORKSPACE_SLUG = "founder";
const MAX_QUOTES = 30;

export interface OwnQuote {
  content: string;
  author: string;
  role?: string;
  source: string;
  sourceUrl: string;
  score: number;
}

export function isOwnBrandUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return OWN_HOSTS.has(host);
  } catch {
    return false;
  }
}

const PLATFORM_LABEL: Record<string, string> = {
  TWITTER: "X",
  LINKEDIN: "LinkedIn",
  REDDIT: "Reddit",
  HACKER_NEWS: "Hacker News",
  PRODUCT_HUNT: "Product Hunt",
  GOOGLE: "Google",
  APP_STORE: "App Store",
  GOOGLE_PLAY: "Google Play",
  CHROME_STORE: "Chrome Web Store",
  SHOPIFY: "Shopify",
  TRUSTPILOT: "Trustpilot",
};

export async function getOwnBrandQuotes(): Promise<OwnQuote[]> {
  const rows = await prisma.testimonial.findMany({
    where: {
      workspace: { slug: OWN_WORKSPACE_SLUG },
      status: "APPROVED",
      sourceUrl: { not: null },
      content: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_QUOTES,
    select: {
      content: true,
      customerName: true,
      customerTitle: true,
      source: true,
      sourceUrl: true,
    },
  });

  return rows
    .filter((r) => r.content && r.sourceUrl)
    .map((r) => ({
      content: r.content as string,
      author: r.customerName,
      role: r.customerTitle ?? undefined,
      source: PLATFORM_LABEL[r.source] ?? "Web",
      sourceUrl: r.sourceUrl as string,
      score: 85,
    }));
}
