import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Embeddable "Trending on Testimoni" badge — served as SVG so it
 * loads instantly, scales cleanly, and works on any site with a
 * plain <img src="...">. Renders three states:
 *   1. Not on directory  → blank (no advertising the visitor's
 *      absence). Owner opts in via Settings before this activates.
 *   2. Recent activity   → animated highlighted "Trending" pill.
 *   3. Baseline listing  → simple "Featured on Testimoni" pill.
 *
 * Sites embed with:
 *   <a href="https://testimoni.io/founders/[slug]">
 *     <img src="https://testimoni.io/api/badges/trending/[slug].svg" />
 *   </a>
 *
 * Cache: 5 min so multiple visitors don't hammer the DB. Long enough
 * to be cheap; short enough that new activity shows up quickly.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/\.svg$/, "");

  const ws = await prisma.workspace.findUnique({
    where: { slug: cleanSlug },
    select: {
      id: true,
      publicListing: true,
      name: true,
    },
  });

  if (!ws || !ws.publicListing) {
    return blankSvg();
  }

  const [approvedCount, latest] = await Promise.all([
    prisma.testimonial.count({
      where: { workspaceId: ws.id, status: "APPROVED" },
    }),
    prisma.testimonial.findFirst({
      where: { workspaceId: ws.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const isTrending =
    latest && Date.now() - latest.createdAt.getTime() < SEVEN_DAYS && approvedCount >= 3;

  const svg = isTrending
    ? trendingBadgeSvg(approvedCount)
    : featuredBadgeSvg(approvedCount);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

function blankSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`;
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

function trendingBadgeSvg(count: number): string {
  const countLabel = `${count} testimonials`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40" role="img" aria-label="Trending on Testimoni — ${countLabel}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8b5cf6"/>
        <stop offset="1" stop-color="#6d28d9"/>
      </linearGradient>
    </defs>
    <rect width="200" height="40" rx="20" fill="url(#g)"/>
    <g transform="translate(14 12)">
      <path d="M8 0L10 5H15L11 8L13 13L8 10L3 13L5 8L1 5H6L8 0Z" fill="#fbbf24"/>
    </g>
    <text x="38" y="17" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="11" font-weight="700" fill="#ffffff" letter-spacing="0.5">TRENDING</text>
    <text x="38" y="31" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="10" fill="#e9d5ff">on Testimoni · ${count}</text>
  </svg>`;
}

function featuredBadgeSvg(count: number): string {
  const countLabel = `${count} testimonials`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40" role="img" aria-label="Featured on Testimoni — ${countLabel}">
    <rect width="200" height="40" rx="20" fill="#ffffff" stroke="#e5e7eb"/>
    <g transform="translate(14 12)">
      <path d="M8 0L10 5H15L11 8L13 13L8 10L3 13L5 8L1 5H6L8 0Z" fill="#8b5cf6"/>
    </g>
    <text x="38" y="17" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="11" font-weight="700" fill="#111827" letter-spacing="0.5">FEATURED</text>
    <text x="38" y="31" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="10" fill="#6b7280">on Testimoni · ${count}</text>
  </svg>`;
}
