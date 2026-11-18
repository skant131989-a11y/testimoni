import { prisma } from "@/lib/prisma";

/**
 * Real quotes from Testimoni's own public wall, for the home hero. Read at
 * build / revalidate time, so the page stays static and fast. Returns an
 * empty list if the database is unreachable; the hero then falls back to a
 * clearly labelled example.
 */

export type WallSource = "X" | "LinkedIn" | "Reddit" | "Product Hunt" | "Hacker News" | "Web";

export interface WallQuote {
  content: string;
  name: string;
  title: string | null;
  source: WallSource;
  url: string | null;
}

export function sourceFromUrl(url: string | null): WallSource {
  if (!url) return "Web";
  const u = url.toLowerCase();
  if (u.includes("x.com") || u.includes("twitter.com")) return "X";
  if (u.includes("linkedin.com")) return "LinkedIn";
  if (u.includes("reddit.com")) return "Reddit";
  if (u.includes("producthunt.com")) return "Product Hunt";
  if (u.includes("ycombinator.com")) return "Hacker News";
  return "Web";
}

export async function getWallQuotes(widgetId: string, limit = 6): Promise<WallQuote[]> {
  try {
    const rows = await prisma.widgetTestimonial.findMany({
      where: { widgetId, testimonial: { status: "APPROVED" } },
      orderBy: { position: "asc" },
      take: 40,
      select: {
        testimonial: {
          select: { content: true, customerName: true, customerTitle: true, customerUrl: true },
        },
      },
    });
    const seen = new Set<string>();
    const out: WallQuote[] = [];
    for (const { testimonial: t } of rows) {
      // Tweets that are replies start with the handle they reply to; drop it
      // so the quote reads as a quote.
      let content = (t.content ?? "").replace(/\s+/g, " ").trim().replace(/^(?:@\w+[\s,:]*)+/, "").trim();
      content = content.charAt(0).toUpperCase() + content.slice(1);
      // Short enough to read at a glance, long enough to say something.
      if (content.length < 40 || content.length > 230) continue;
      const key = content.slice(0, 60).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        content,
        name: t.customerName,
        title: t.customerTitle ?? null,
        source: sourceFromUrl(t.customerUrl ?? null),
        url: t.customerUrl ?? null,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}
