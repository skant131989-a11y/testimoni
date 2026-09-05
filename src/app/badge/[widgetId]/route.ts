import { prisma } from "@/lib/prisma";
import {
  buildBadgeSvg,
  parseBadgeStyle,
  parseBadgeTheme,
  parseBadgeSize,
} from "@/lib/badge-svg";

/**
 * GET /badge/[widgetId]?style=pill&theme=light&size=md&name=Acme
 *
 * Live SVG star rating badge for a workspace/widget.
 *
 * - Reads the widget's associated APPROVED testimonials
 * - Computes average rating + count
 * - Renders the SVG (same generator as /tools/star-badge)
 * - Serves as image/svg+xml so it can be dropped in with:
 *     <img src="https://testimoni.io/badge/xxx" alt="4.8 stars" />
 *
 * Cache: 5 min public + 1 hour stale-while-revalidate. Approving a
 * new testimonial changes the rating; users don't need instant
 * propagation but shouldn't wait a full day either.
 *
 * Fallback: if the widget has zero approved testimonials, we still
 * render a "no reviews yet" badge (rating=5, count=0, name-only)
 * so embeds don't 404 on new customers.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ widgetId: string }> },
) {
  const { widgetId } = await params;
  const url = new URL(request.url);
  const style = parseBadgeStyle(url.searchParams.get("style"));
  const themeId = parseBadgeTheme(url.searchParams.get("theme"));
  const sizeId = parseBadgeSize(url.searchParams.get("size"));
  const businessName = (url.searchParams.get("name") || "").slice(0, 40);

  const widget = await prisma.widget.findUnique({
    where: { id: widgetId },
    include: {
      testimonials: {
        where: { testimonial: { status: "APPROVED" } },
        include: { testimonial: { select: { rating: true } } },
      },
    },
  });

  if (!widget || !widget.isActive) {
    return new Response("Widget not found", { status: 404 });
  }

  const ratings = widget.testimonials
    .map((wt) => wt.testimonial.rating)
    .filter((r): r is number => typeof r === "number" && r > 0);

  const count = ratings.length;
  const average =
    count > 0 ? ratings.reduce((sum, r) => sum + r, 0) / count : 5;

  const svg = buildBadgeSvg({
    rating: average,
    reviewCount: count,
    businessName,
    style,
    themeId,
    sizeId,
  });

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      // 5 min fresh, 1 hour stale-while-revalidate. Balances "user
      // sees new rating quickly" vs. "avoid hammering the DB from
      // every page view of the customer's site".
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
      // Allow direct <img src> embedding from any origin.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
