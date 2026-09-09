import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { invalidateWallCache } from "@/lib/wall-cache";

/**
 * Approve a testimonial.
 *
 * Two things happen:
 *   1. status flips PENDING → APPROVED
 *   2. The testimonial is added to the workspace's default (oldest
 *      active) widget via a WidgetTestimonial join row.
 *
 * The widget wire-in is essential — without it, an "approved"
 * testimonial has status=APPROVED but is invisible on every wall
 * because no widget references it. Users complained about
 * screenshot/URL imports appearing on their wall automatically
 * while review-sync imports required a second manual step. This
 * makes the approve action symmetric across all intake paths.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.testimonial.findFirst({
    where: { id, workspaceId: auth.workspace.id },
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Wrap the status flip + widget wire-in in a transaction so an
  // approve either fully completes or leaves the DB untouched.
  await prisma.$transaction(async (tx) => {
    await tx.testimonial.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    const defaultWidget = await tx.widget.findFirst({
      where: { workspaceId: auth.workspace.id, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (defaultWidget) {
      const lastPos = await tx.widgetTestimonial.findFirst({
        where: { widgetId: defaultWidget.id },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await tx.widgetTestimonial.upsert({
        where: {
          widgetId_testimonialId: {
            widgetId: defaultWidget.id,
            testimonialId: id,
          },
        },
        create: {
          widgetId: defaultWidget.id,
          testimonialId: id,
          position: (lastPos?.position ?? -1) + 1,
        },
        update: {}, // Already on the widget — no-op keeps position.
      });
    }
  });

  invalidateWallCache();

  return NextResponse.redirect(
    new URL("/dashboard/testimonials", request.url),
    303,
  );
}

