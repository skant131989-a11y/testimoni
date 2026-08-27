import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { z } from "zod";
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
