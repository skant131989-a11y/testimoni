import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";

/**
 * POST /api/widget/[widgetId]?impression=1
 *
 * The embed script (public/embed/widget.js) sends one of these with
 * navigator.sendBeacon each time a wall renders, and sendBeacon always
 * POSTs. This route only had GET, so every view was rejected and
 * widget_analytics stayed empty (Total Impressions read 0 for everyone).
 * One row per widget per UTC day, incremented here. Known crawlers and
 * link-preview bots are not counted.
 */
const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;
  const headers = { "Access-Control-Allow-Origin": "*" };

  if (new URL(request.url).searchParams.get("impression") !== "1") {
    return new NextResponse(null, { status: 400, headers });
  }
  if (BOT_UA.test(request.headers.get("user-agent") || "")) {
    return new NextResponse(null, { status: 204, headers });
  }

  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  try {
    await prisma.widgetAnalytics.upsert({
      where: { widgetId_date: { widgetId, date: day } },
      create: { widgetId, date: day, impressions: 1 },
      update: { impressions: { increment: 1 } },
    });
  } catch {
    // Unknown widget id (foreign key) or a database blip: never fail a visitor's page.
  }
  return new NextResponse(null, { status: 204, headers });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;

  const widget = await prisma.widget.findUnique({
    where: { id: widgetId },
    include: {
      workspace: {
        select: {
          slug: true,
          name: true,
          websiteUrl: true,
          subscription: { select: { plan: true } },
        },
      },
      testimonials: {
        orderBy: { position: "asc" },
        include: {
          testimonial: {
            select: {
              id: true,
              content: true,
              rating: true,
              customerName: true,
              customerAvatar: true,
              customerTitle: true,
              customerUrl: true,
              videoUrl: true,
              imageUrls: true,
              createdAt: true,
            },
          },
        },
        where: {
          testimonial: { status: "APPROVED" },
        },
      },
    },
  });

  if (!widget || !widget.isActive) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }

  const plan = getEffectivePlan(widget.workspace.slug, widget.workspace.subscription?.plan);
  const showWatermark = plan === "FREE";
  // Layout gating: FREE plan is grid-only. If a workspace downgrades
  // to FREE and still owns non-GRID widgets, serve them as GRID rather
  // than 404'ing or leaking a Pro layout for free.
  const effectiveLayout = plan === "FREE" ? "GRID" : widget.layout;

  // Apply maxItems limit if set. Widget script generates letter avatars
  // client-side when customerAvatar is null — no per-visitor lookups.
  let testimonials = widget.testimonials.map((wt) => wt.testimonial);
  if (widget.maxItems) {
    testimonials = testimonials.slice(0, widget.maxItems);
  }

  const response = NextResponse.json({
    widget: {
      id: widget.id,
      name: widget.name,
      layout: effectiveLayout,
      theme: widget.theme,
      config: widget.config,
      showRating: widget.showRating,
      showAvatar: widget.showAvatar,
      showDate: widget.showDate,
      customCss: widget.customCss,
    },
    testimonials,
    showWatermark,
    // Used by the embed script for schema.org review markup.
    workspace: { name: widget.workspace.name, url: widget.workspace.websiteUrl },
  });

  // Set CDN cache headers
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );

  return response;
}
