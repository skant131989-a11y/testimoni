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

  // Apply maxItems limit if set
  let testimonials = widget.testimonials.map((wt) => wt.testimonial);
  if (widget.maxItems) {
    testimonials = testimonials.slice(0, widget.maxItems);
  }

  const response = NextResponse.json({
    widget: {
      id: widget.id,
      name: widget.name,
      layout: widget.layout,
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
