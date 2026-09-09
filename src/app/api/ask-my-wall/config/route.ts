import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUserWithWorkspace } from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";

/**
 * POST /api/ask-my-wall/config
 *
 * Enables Ask My Wall for the caller's workspace. Pro-only. On
 * first hit, creates the AskMyWallConfig row so the public
 * endpoint starts serving.
 */
export async function POST() {
  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = getEffectivePlan(member.workspace.slug, member.workspace.subscription?.plan);
  if (!PLAN_LIMITS[plan].askMyWall) {
    return NextResponse.json(
      { error: "plan_required", message: "Ask My Wall is a Pro feature." },
      { status: 402 }
    );
  }

  const config = await prisma.askMyWallConfig.upsert({
    where: { workspaceId: member.workspace.id },
    update: { isActive: true },
    create: { workspaceId: member.workspace.id, isActive: true },
  });

  return NextResponse.json({ config });
}

export async function DELETE() {
  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.askMyWallConfig.updateMany({
    where: { workspaceId: member.workspace.id },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
