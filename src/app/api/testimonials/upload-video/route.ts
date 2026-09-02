import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { getEffectiveLimits } from "@/lib/plan";
import { createAdminClient, VIDEO_BUCKET } from "@/lib/supabase/admin";

/**
 * POST /api/testimonials/upload-video
 *
 * Uploads a video file to Supabase Storage and (optionally) attaches
 * it to an existing testimonial. Pro-only feature.
 *
 * Body: multipart/form-data
 *   - file: the video file (MP4, max 100MB)
 *   - testimonialId (optional): if present, updates that testimonial;
 *     otherwise returns the URL for the client to attach on create.
 */
const MAX_BYTES = 50 * 1024 * 1024; // 50MB — matches Supabase Free plan cap
const ALLOWED_TYPES = new Set([
  "video/mp4",
  "video/quicktime", // .mov files often uploaded as this
]);

export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Plan check — Free gets 1 video, Pro gets unlimited. Count only
  // videos already stored in Supabase Storage (has videoStorageKey);
  // external videoUrl-only rows are legacy imports and don't touch
  // our storage quota.
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: auth.workspace.id },
  });
  const limits = getEffectiveLimits(auth.workspace.slug, subscription?.plan);
  const currentVideoCount = await prisma.testimonial.count({
    where: {
      workspaceId: auth.workspace.id,
      videoStorageKey: { not: null },
    },
  });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const testimonialId = formData.get("testimonialId");

  // Uploading to a NEW testimonial counts toward the quota. Replacing
  // the video on an existing testimonial that already has one does
  // not (net-zero). Compute the "effective count after this upload"
  // and gate on that.
  const isReplacingExistingVideo =
    typeof testimonialId === "string" &&
    testimonialId &&
    (await prisma.testimonial.findFirst({
      where: {
        id: testimonialId,
        workspaceId: auth.workspace.id,
        videoStorageKey: { not: null },
      },
      select: { id: true },
    })) !== null;

  const projectedCount = isReplacingExistingVideo
    ? currentVideoCount
    : currentVideoCount + 1;

  if (projectedCount > limits.maxVideos) {
    return NextResponse.json(
      {
        error:
          limits.maxVideos === 0
            ? "Video testimonials are a Pro feature. Upgrade to unlock."
            : `You've used your ${limits.maxVideos} free video. Delete it to upload a new one, or upgrade to Pro for unlimited.`,
        upgradeRequired: true,
        maxVideos: limits.maxVideos,
        currentVideoCount,
      },
      { status: 403 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported format: ${file.type || "unknown"}. Upload an MP4 or MOV file.`,
      },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max 50MB.`,
      },
      { status: 413 }
    );
  }

  // If updating an existing testimonial, verify it belongs to this
  // workspace before we spend the upload cycles.
  let existingKey: string | null = null;
  if (typeof testimonialId === "string" && testimonialId) {
    const t = await prisma.testimonial.findFirst({
      where: { id: testimonialId, workspaceId: auth.workspace.id },
      select: { id: true, videoStorageKey: true },
    });
    if (!t) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }
    existingKey = t.videoStorageKey;
  }

  // Namespace by workspace so cleanup / analytics / abuse investigation
  // stay tractable. crypto.randomUUID keeps filenames non-guessable.
  const ext = file.type === "video/quicktime" ? "mov" : "mp4";
  const storageKey = `${auth.workspace.id}/${crypto.randomUUID()}.${ext}`;

  const supabase = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(storageKey, buffer, {
      contentType: file.type,
      cacheControl: "31536000", // 1 year — objects are immutable
      upsert: false,
    });

  if (uploadErr) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadErr.message}` },
      { status: 500 }
    );
  }

  // Public URL — the bucket is public-read, so no signed-URL rotation
  // needed for the CDN path. If we ever move to private buckets this
  // is the one place to swap in createSignedUrl.
  const {
    data: { publicUrl },
  } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(storageKey);

  // If this was for an existing testimonial, persist + clean up the
  // old file. We do this AFTER upload succeeds so a failed upload
  // doesn't orphan the row.
  if (typeof testimonialId === "string" && testimonialId) {
    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        videoUrl: publicUrl,
        videoStorageKey: storageKey,
      },
    });
    if (existingKey) {
      // Best-effort — a failure here just leaves a small orphan.
      await supabase.storage.from(VIDEO_BUCKET).remove([existingKey]).catch(() => {});
    }
  }

  return NextResponse.json({
    videoUrl: publicUrl,
    storageKey,
    sizeBytes: file.size,
  });
}
