import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

/**
 * Bulk approve — flips a batch of testimonials to APPROVED and
 * wires each into the workspace's default (oldest active) widget.
 *
 * Request shape:
 *   { minRating?: number }  // optional threshold; defaults to 0
 *
 * Approves EVERY pending testimonial in the workspace with
 * rating >= minRating (nulls treated as 0). Returns the count.
 *
 * Runs inside a single transaction so a partial failure rolls back
 * everything — either every row moves or nothing does. This
 * matters because if we half-committed, users would end up with a
 * mixed inbox that's hard to reason about.
 */
const SCHEMA = z.object({
  minRating: z.number().int().min(0).max(5).optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine — default to approving all pending.
  }
  const parsed = SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const minRating = parsed.data.minRating ?? 0;

  // Fetch the ID list first so we can (a) return an accurate count
  // and (b) know which testimonials to add to the widget.
  const pending = await prisma.testimonial.findMany({
    where: {
      workspaceId: auth.workspace.id,
      status: "PENDING",
      ...(minRating > 0 ? { rating: { gte: minRating } } : {}),
    },
    select: { id: true },
  });
  if (pending.length === 0) {
    return NextResponse.json({ approved: 0 });
  }
  const ids = pending.map((p) => p.id);

  const defaultWidget = await prisma.widget.findFirst({
    where: { workspaceId: auth.workspace.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.testimonial.updateMany({
      where: { id: { in: ids } },
      data: { status: "APPROVED" },
    });

    if (defaultWidget) {
      // Determine the current tail position of the widget so bulk-
      // approved rows land at the END, preserving any manual ordering
      // the user had already done.
      const lastPos = await tx.widgetTestimonial.findFirst({
        where: { widgetId: defaultWidget.id },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const startPos = (lastPos?.position ?? -1) + 1;

      // Insert one WidgetTestimonial per approved testimonial, using
      // createMany + skipDuplicates so re-runs are idempotent (if
      // some rows were already on the widget, they get skipped).
      await tx.widgetTestimonial.createMany({
        data: ids.map((id, index) => ({
          widgetId: defaultWidget.id,
          testimonialId: id,
          position: startPos + index,
        })),
        skipDuplicates: true,
      });
    }
  });

  return NextResponse.json({ approved: ids.length });
}
