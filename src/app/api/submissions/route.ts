import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { createSubmissionSchema } from "@/lib/validations/submission";

export async function GET(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
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
  // Public endpoint - no auth required
  const body = await request.json();
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

  return NextResponse.json(
    { submission: { id: submission.id }, message: "Submission received" },
    { status: 201 }
  );
}
