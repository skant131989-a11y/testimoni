import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  getDbUserWithWorkspace,
  loadDbUserWithWorkspaceFresh,
} from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { syncReviewSource } from "@/lib/review-sources/sync";

/**
 * Sync, patch, and delete for a single review source.
 *   POST   /api/review-sources/[id]  — trigger an on-demand sync
 *   PATCH  /api/review-sources/[id]  — edit autoApprove / minRating
 *   DELETE /api/review-sources/[id]  — disconnect (keeps testimonials)
 *
 * Sync + patch are Pro-only. Delete is available on any plan so
 * users can still remove sources they connected before downgrading.
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
  return { workspaceId: membership.workspaceId, plan };
}

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
  if (ctx.plan !== "PRO") {
    return NextResponse.json(
      { error: "Syncing is a Pro feature.", upgradeRequired: true },
      { status: 402 },
    );
  }

  const result = await syncReviewSource(source);
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
  if (ctx.plan !== "PRO") {
    return NextResponse.json(
      { error: "Editing sources is a Pro feature.", upgradeRequired: true },
      { status: 402 },
    );
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
