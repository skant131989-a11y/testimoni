import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { updateTestimonialSchema } from "@/lib/validations/testimonial";
import { createAdminClient, VIDEO_BUCKET } from "@/lib/supabase/admin";

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

  // Video-clear path: if the client explicitly nulled videoUrl, also
  // clear the storage key AND delete the file from Supabase Storage so
  // it stops counting against the workspace quota.
  const clearingVideo = parsed.data.videoUrl === null && existing.videoStorageKey;
  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(clearingVideo ? { videoStorageKey: null, videoDurationSeconds: null } : {}),
    },
  });

  if (clearingVideo && existing.videoStorageKey) {
    const supabase = createAdminClient();
    // Best-effort — a failure here just leaves an orphaned object.
    await supabase.storage
      .from(VIDEO_BUCKET)
      .remove([existing.videoStorageKey])
      .catch(() => {});
  }

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

  // Clean up any uploaded video so storage costs match reality.
  if (existing.videoStorageKey) {
    const supabase = createAdminClient();
    await supabase.storage
      .from(VIDEO_BUCKET)
      .remove([existing.videoStorageKey])
      .catch(() => {});
  }

  return NextResponse.json({ success: true });
}

