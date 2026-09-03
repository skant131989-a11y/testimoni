import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { createSubmissionSchema } from "@/lib/validations/submission";
import { generateSlug } from "@/lib/utils";
import { getEffectiveLimits } from "@/lib/plan";

export async function GET(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  if (url.searchParams.get("listForms") === "true") {
    const forms = await prisma.collectionForm.findMany({
      where: { workspaceId: auth.workspace.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        headline: true,
        createdAt: true,
        workspace: { select: { slug: true } },
        _count: { select: { submissions: true } },
      },
    });
    return NextResponse.json({ forms });
  }

  const status = url.searchParams.get("status");
  const formId = url.searchParams.get("formId");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    form: {
      workspaceId: auth.workspace.id,
    },
  };

  if (status && ["NEW", "APPROVED", "REJECTED", "SPAM"].includes(status)) {
    where.status = status;
  }

  if (formId) {
    where.formId = formId;
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        form: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return NextResponse.json({
    submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  // Authed action: create a new CollectionForm from the dashboard
  if (body?.action === "createForm") {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Plan limit — Free allows 1 form
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: auth.workspace.id },
    });
    const limits = getEffectiveLimits(auth.workspace.slug, subscription?.plan);
    const currentForms = await prisma.collectionForm.count({
      where: { workspaceId: auth.workspace.id },
    });
    if (currentForms >= limits.maxForms) {
      return NextResponse.json(
        {
          error:
            "Collection form limit reached on the Free plan. Upgrade to Pro to create more.",
        },
        { status: 403 }
      );
    }

    // Ensure slug is unique within the workspace
    const base = generateSlug(name) || "form";
    let slug = base;
    let n = 1;
    while (
      await prisma.collectionForm.findFirst({
        where: { workspaceId: auth.workspace.id, slug },
        select: { id: true },
      })
    ) {
      n += 1;
      slug = `${base}-${n}`;
    }

    const form = await prisma.collectionForm.create({
      data: {
        workspaceId: auth.workspace.id,
        name,
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        headline: true,
        createdAt: true,
        workspace: { select: { slug: true } },
        _count: { select: { submissions: true } },
      },
    });

    return NextResponse.json({ form }, { status: 201 });
  }

  // Public endpoint - no auth required (submission from embed/collect form)
  const parsed = createSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { formId, ...submissionData } = parsed.data;

  // Verify form exists and is active
  const form = await prisma.collectionForm.findUnique({
    where: { id: formId },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (!form.isActive) {
    return NextResponse.json(
      { error: "This form is no longer accepting submissions" },
      { status: 403 }
    );
  }

  // Auto-approve path — insert directly into the Testimonial library
  // with APPROVED status so it shows on the wall immediately, no
  // manual moderation. Used on demo workspaces to make the product
  // feel alive when a visitor pokes at it.
  if (form.autoApprove) {
    const testimonial = await prisma.testimonial.create({
      data: {
        workspaceId: form.workspaceId,
        customerName: submissionData.customerName,
        customerEmail: submissionData.customerEmail,
        content: submissionData.content,
        rating: submissionData.rating,
        videoUrl: submissionData.videoUrl,
        imageUrls: submissionData.imageUrls ?? [],
        source: "FORM",
        status: "APPROVED",
      },
    });

    // Mirror the manual approve flow: link the fresh testimonial to
    // the workspace's default (oldest active) widget so it renders
    // on the wall + embed. Without this step the testimonial stays
    // in the library but never appears on /w/[widgetId].
    const defaultWidget = await prisma.widget.findFirst({
      where: { workspaceId: form.workspaceId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (defaultWidget) {
      const nextPosition = await prisma.widgetTestimonial.count({
        where: { widgetId: defaultWidget.id },
      });
      await prisma.widgetTestimonial.create({
        data: {
          widgetId: defaultWidget.id,
          testimonialId: testimonial.id,
          position: nextPosition,
        },
      });
    }

    const response = NextResponse.json(
      { submission: { id: testimonial.id }, message: "Submission received" },
      { status: 201 }
    );
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }

  const submission = await prisma.submission.create({
    data: {
      formId,
      customerName: submissionData.customerName,
      customerEmail: submissionData.customerEmail,
      content: submissionData.content,
      rating: submissionData.rating,
      videoUrl: submissionData.videoUrl,
      imageUrls: submissionData.imageUrls,
      answers: submissionData.answers as Record<string, string>,
      status: "NEW",
    },
  });

  const response = NextResponse.json(
    { submission: { id: submission.id }, message: "Submission received" },
    { status: 201 }
  );
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
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
