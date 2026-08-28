import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { createTestimonialSchema } from "@/lib/validations/testimonial";
import { getEffectiveLimits } from "@/lib/plan";

export async function GET(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    workspaceId: auth.workspace.id,
  };

  if (status && ["PENDING", "APPROVED", "ARCHIVED"].includes(status)) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return NextResponse.json({
    testimonials,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
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
  const limits = getEffectiveLimits(auth.workspace.slug, subscription?.plan);

  const currentCount = await prisma.testimonial.count({
    where: { workspaceId: auth.workspace.id },
  });

  if (currentCount >= limits.maxTestimonials) {
    return NextResponse.json(
      { error: "Testimonial limit reached. Please upgrade to Pro." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createTestimonialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      workspaceId: auth.workspace.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ testimonial }, { status: 201 });
}
