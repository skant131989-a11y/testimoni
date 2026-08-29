import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { getEffectiveLimits } from "@/lib/plan";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { form: { select: { workspaceId: true } } },
  });

  if (!submission || submission.form.workspaceId !== auth.workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (submission.testimonialId) {
    return NextResponse.json({ error: "Already approved" }, { status: 400 });
  }

  // Enforce testimonial plan limit here too — approving a submission
  // creates a Testimonial row, same as direct create.
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: auth.workspace.id },
  });
  const limits = getEffectiveLimits(auth.workspace.slug, subscription?.plan);
  const currentCount = await prisma.testimonial.count({
    where: { workspaceId: auth.workspace.id },
  });
  if (currentCount >= limits.maxTestimonials) {
    return NextResponse.json(
      {
        error:
          "Testimonial limit reached on the Free plan. Upgrade to Pro to approve more submissions.",
      },
      { status: 403 }
    );
  }

  const [testimonial] = await prisma.$transaction([
    prisma.testimonial.create({
      data: {
        workspaceId: auth.workspace.id,
        content: submission.content,
        rating: submission.rating,
        videoUrl: submission.videoUrl,
        imageUrls: submission.imageUrls,
        customerName: submission.customerName,
        customerEmail: submission.customerEmail,
        source: "FORM",
        status: "APPROVED",
      },
    }),
    prisma.submission.update({
      where: { id },
      data: { status: "APPROVED" },
    }),
  ]);

  await prisma.submission.update({
    where: { id },
    data: { testimonialId: testimonial.id },
  });

  return NextResponse.json({ ok: true, testimonialId: testimonial.id });
}
