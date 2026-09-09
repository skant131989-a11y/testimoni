import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  getDbUserWithWorkspace,
  loadDbUserWithWorkspaceFresh,
} from "@/lib/session";
import { getEffectivePlan, getEffectiveLimits } from "@/lib/plan";
import { syncReviewSource } from "@/lib/review-sources/sync";
import { invalidateWallCache } from "@/lib/wall-cache";

/**
 * Sync, patch, and delete for a single review source.
 *   POST   /api/review-sources/[id]  — trigger an on-demand sync
 *   PATCH  /api/review-sources/[id]  — edit autoApprove / minRating
 *   DELETE /api/review-sources/[id]  — disconnect (keeps testimonials)
 *
 * Manual sync is FREE — anyone can hit "Import now" once every
 * hour (per source). autoApprove stays Pro-only. Delete is
 * available on any plan so users can still remove sources they
 * connected before downgrading.
 */

async function resolveWorkspace() {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  const dbUser =
    (await getDbUserWithWorkspace()) ?? (await loadDbUserWithWorkspaceFresh());
  const membership = dbUser?.workspaceMembers[0];
  if (!membership) return null;
  const plan = getEffectivePlan(
    membership.workspace.slug,
    membership.workspace.subscription?.plan,
  );
  const limits = getEffectiveLimits(
    membership.workspace.slug,
    membership.workspace.subscription?.plan,
  );
  return { workspaceId: membership.workspaceId, plan, limits };
}

const MIN_MS_BETWEEN_FREE_SYNCS = 60 * 60 * 1000; // 1 hour

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const source = await prisma.reviewSource.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!source) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }

  // Free workspaces: rate-limit manual syncs to once per hour per
  // source. Prevents someone from hammering the App Store adapter
  // to run up our compute bill without upgrading. Pro workspaces
  // have no rate limit.
  if (ctx.plan !== "PRO") {
    const lastSync = source.lastSyncedAt?.getTime() ?? 0;
    const elapsed = Date.now() - lastSync;
    if (lastSync && elapsed < MIN_MS_BETWEEN_FREE_SYNCS) {
      const waitMinutes = Math.ceil(
        (MIN_MS_BETWEEN_FREE_SYNCS - elapsed) / 60_000,
      );
      return NextResponse.json(
        {
          error: `Free plan can sync once per hour. Try again in ${waitMinutes} min, or upgrade to Pro for auto-sync.`,
          upgradeRequired: true,
        },
        { status: 429 },
      );
    }
  }

  // Free workspaces: hard cap at maxTestimonials. Compute how many
  // slots the workspace still has and pass to the sync engine so
  // it only imports up to that many.
  let maxToImport: number | undefined;
  if (Number.isFinite(ctx.limits.maxTestimonials)) {
    const currentCount = await prisma.testimonial.count({
      where: { workspaceId: ctx.workspaceId },
    });
    const remaining = ctx.limits.maxTestimonials - currentCount;
    if (remaining <= 0) {
      return NextResponse.json(
        {
          error: `You've hit your ${ctx.limits.maxTestimonials}-testimonial cap. Upgrade to Pro for unlimited.`,
          upgradeRequired: true,
          capReached: true,
        },
        { status: 402 },
      );
    }
    maxToImport = remaining;
  }

  const result = await syncReviewSource(source, {
    maxToImport,
    forcePending: ctx.plan !== "PRO",
  });
  if (result.imported > 0) {
    invalidateWallCache();
  }
  return NextResponse.json({ result });
}

/**
 * Edit source settings — currently just autoApprove and minRating.
 * Anything else the user touches is either derived (externalAppId)
 * or system-managed (syncStatus, lastSyncedAt).
 */
const PATCH_SCHEMA = z.object({
  autoApprove: z.boolean().optional(),
  minRating: z.number().int().min(1).max(5).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const source = await prisma.reviewSource.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!source) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PATCH_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // autoApprove = true is Pro-only. Free users can freely toggle
  // minRating (cheap filter, no side effects), but auto-approving
  // future imports to skip curation is a paid perk.
  if (parsed.data.autoApprove === true && ctx.plan !== "PRO") {
    return NextResponse.json(
      {
        error: "Auto-approve is a Pro feature. Free plan imports land in the pending queue for manual approval.",
        upgradeRequired: true,
      },
      { status: 402 },
    );
  }

  const updated = await prisma.reviewSource.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ source: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await resolveWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const source = await prisma.reviewSource.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!source) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }

  // Cascade the delete but leave the imported testimonials on the
  // wall — the review-source deletion sets reviewSourceId to NULL
  // via the SetNull FK. Users expect their curated wall to stay
  // intact when they disconnect a source.
  await prisma.reviewSource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
