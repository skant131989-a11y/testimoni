import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

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

  return NextResponse.redirect(new URL("/dashboard/inbox", request.url), 303);
}
