import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PLAN_LIMITS } from "@/lib/constants";

const createWidgetSchema = z.object({
  name: z.string().min(1).max(200),
  layout: z.enum(["GRID", "MASONRY", "CAROUSEL", "LIST", "MARQUEE"]).default("GRID"),
  theme: z.record(z.string(), z.unknown()).default({}),
  config: z.record(z.string(), z.unknown()).default({}),
  filterTags: z.array(z.string().max(50)).max(20).default([]),
  maxItems: z.number().int().min(1).max(100).optional().nullable(),
  showRating: z.boolean().default(true),
  showAvatar: z.boolean().default(true),
  showDate: z.boolean().default(false),
  customCss: z.string().max(10000).optional().nullable(),
});

export async function GET(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const widget = await prisma.widget.findFirst({
      where: { id, workspaceId: auth.workspace.id },
      include: {
        testimonials: {
          orderBy: { position: "asc" },
          select: { testimonialId: true, position: true },
        },
      },
    });
    if (!widget) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ widget });
  }

  const widgets = await prisma.widget.findMany({
    where: { workspaceId: auth.workspace.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { testimonials: true } },
    },
  });

  return NextResponse.json({ widgets });
}

export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check plan limits
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: auth.workspace.id },
  });
  const plan = subscription?.plan || "FREE";
  const limits = PLAN_LIMITS[plan];

  const currentCount = await prisma.widget.count({
    where: { workspaceId: auth.workspace.id },
  });

  if (currentCount >= limits.maxWidgets) {
    return NextResponse.json(
      { error: "Widget limit reached. Please upgrade to Pro." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createWidgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check layout is allowed on current plan
  const allowedLayouts = limits.layouts as readonly string[];
  if (!allowedLayouts.includes(parsed.data.layout)) {
    return NextResponse.json(
      { error: `Layout "${parsed.data.layout}" is not available on the ${plan} plan.` },
      { status: 403 }
    );
  }

  const widget = await prisma.widget.create({
    data: {
      workspaceId: auth.workspace.id,
      name: parsed.data.name,
      layout: parsed.data.layout,
      theme: parsed.data.theme as Record<string, string>,
      config: parsed.data.config as Record<string, string>,
      filterTags: parsed.data.filterTags,
      maxItems: parsed.data.maxItems,
      showRating: parsed.data.showRating,
      showAvatar: parsed.data.showAvatar,
      showDate: parsed.data.showDate,
      customCss: parsed.data.customCss,
    },
  });

  return NextResponse.json({ widget }, { status: 201 });
}

const updateWidgetSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  layout: z.enum(["GRID", "MASONRY", "CAROUSEL", "LIST", "MARQUEE"]).optional(),
  theme: z.record(z.string(), z.unknown()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  maxItems: z.number().int().min(1).max(100).optional().nullable(),
  showRating: z.boolean().optional(),
  showAvatar: z.boolean().optional(),
  showDate: z.boolean().optional(),
  customCss: z.string().max(10000).optional().nullable(),
  isActive: z.boolean().optional(),
  testimonialIds: z.array(z.string()).optional(),
});

export async function PATCH(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateWidgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, testimonialIds, ...updates } = parsed.data;

  const existing = await prisma.widget.findFirst({
    where: { id, workspaceId: auth.workspace.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Update widget scalar fields — build the Prisma input explicitly so the
  // JSON fields (theme, config) don't get mis-typed by the Zod inferred shape.
  const data: Prisma.WidgetUpdateInput = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.layout !== undefined) data.layout = updates.layout;
  if (updates.maxItems !== undefined) data.maxItems = updates.maxItems;
  if (updates.showRating !== undefined) data.showRating = updates.showRating;
  if (updates.showAvatar !== undefined) data.showAvatar = updates.showAvatar;
  if (updates.showDate !== undefined) data.showDate = updates.showDate;
  if (updates.customCss !== undefined) data.customCss = updates.customCss;
  if (updates.isActive !== undefined) data.isActive = updates.isActive;
  if (updates.theme !== undefined) data.theme = updates.theme as Prisma.InputJsonValue;
  if (updates.config !== undefined) data.config = updates.config as Prisma.InputJsonValue;

  await prisma.widget.update({ where: { id }, data });

  // Sync attached testimonials via the join table
  if (testimonialIds) {
    // Verify all testimonials belong to the workspace
    const validCount = await prisma.testimonial.count({
      where: {
        id: { in: testimonialIds },
        workspaceId: auth.workspace.id,
      },
    });
    if (validCount !== testimonialIds.length) {
      return NextResponse.json(
        { error: "One or more testimonials do not belong to this workspace" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.widgetTestimonial.deleteMany({ where: { widgetId: id } }),
      prisma.widgetTestimonial.createMany({
        data: testimonialIds.map((testimonialId, position) => ({
          widgetId: id,
          testimonialId,
          position,
        })),
      }),
    ]);
  }

  const widget = await prisma.widget.findUnique({
    where: { id },
    include: {
      testimonials: {
        orderBy: { position: "asc" },
        select: { testimonialId: true, position: true },
      },
    },
  });

  return NextResponse.json({ widget });
}
