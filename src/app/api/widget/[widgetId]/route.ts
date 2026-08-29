import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";

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
  });

  // Set CDN cache headers
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );

  return response;
}
