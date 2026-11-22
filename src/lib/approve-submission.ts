import { prisma } from "@/lib/prisma";
import { getEffectiveLimits } from "@/lib/plan";
import { invalidateWallCache } from "@/lib/wall-cache";

/**
 * Approve one submission: it becomes a testimonial and goes on the workspace's
 * default widget, so it is live on the wall right away. Shared by the
 * dashboard's Approve button, the live alert, and the one-tap email link.
 */
export type ApproveResult =
  | { ok: true; testimonialId: string; widget: { id: string; name: string } | null }
  | { ok: false; status: number; error: string };

export async function approveSubmission(args: {
  workspaceId: string;
  workspaceSlug: string;
  submissionId: string;
}): Promise<ApproveResult> {
  const { workspaceId, workspaceSlug, submissionId: id } = args;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { form: { select: { workspaceId: true } } },
  });
  if (!submission || submission.form.workspaceId !== workspaceId) {
    return { ok: false, status: 404, error: "Not found" };
  }
  if (submission.testimonialId) return { ok: false, status: 400, error: "Already approved" };

  // Approving creates a testimonial, so the plan limit applies here too.
  const subscription = await prisma.subscription.findUnique({ where: { workspaceId } });
  const limits = getEffectiveLimits(workspaceSlug, subscription?.plan);
  const currentCount = await prisma.testimonial.count({ where: { workspaceId } });
  if (currentCount >= limits.maxTestimonials) {
    return {
      ok: false,
      status: 403,
      error: "Testimonial limit reached on the Free plan. Upgrade to Pro to approve more submissions.",
    };
  }

  const [testimonial] = await prisma.$transaction([
    prisma.testimonial.create({
      data: {
        workspaceId,
        content: submission.content,
        rating: submission.rating,
        videoUrl: submission.videoUrl,
        imageUrls: submission.imageUrls,
        customerName: submission.customerName,
        customerEmail: submission.customerEmail,
        // The public form stores the job title in answers.jobTitle.
        customerTitle:
          (submission.answers &&
            typeof submission.answers === "object" &&
            (submission.answers as { jobTitle?: string }).jobTitle) ||
          null,
        source: "FORM",
        status: "APPROVED",
      },
    }),
    prisma.submission.update({ where: { id }, data: { status: "APPROVED" } }),
  ]);
  await prisma.submission.update({ where: { id }, data: { testimonialId: testimonial.id } });

  // Put it on the default (oldest active) widget so it shows on the wall and embed.
  const defaultWidget = await prisma.widget.findFirst({
    where: { workspaceId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (defaultWidget) {
    const nextPosition = await prisma.widgetTestimonial.count({ where: { widgetId: defaultWidget.id } });
    await prisma.widgetTestimonial.upsert({
      where: { widgetId_testimonialId: { widgetId: defaultWidget.id, testimonialId: testimonial.id } },
      create: { widgetId: defaultWidget.id, testimonialId: testimonial.id, position: nextPosition },
      update: {},
    });
  }

  invalidateWallCache();
  return { ok: true, testimonialId: testimonial.id, widget: defaultWidget };
}
