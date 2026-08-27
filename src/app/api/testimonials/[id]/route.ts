import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { updateTestimonialSchema } from "@/lib/validations/testimonial";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the testimonial belongs to the user's workspace
  const existing = await prisma.testimonial.findFirst({
    where: { id, workspaceId: auth.workspace.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Testimonial not found" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const parsed = updateTestimonialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ testimonial });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the testimonial belongs to the user's workspace
  const existing = await prisma.testimonial.findFirst({
    where: { id, workspaceId: auth.workspace.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Testimonial not found" },
      { status: 404 }
    );
  }

  await prisma.testimonial.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
