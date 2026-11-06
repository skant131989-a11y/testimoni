import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUserWithWorkspace } from "@/lib/session";
import { newHookSecret } from "@/lib/requests";

/** POST /api/requests/hook — replace the workspace's webhook secret (the old URL stops working). */
export async function POST() {
  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = newHookSecret();
  await prisma.requestHook.upsert({
    where: { workspaceId: member.workspaceId },
    update: { secret },
    create: { workspaceId: member.workspaceId, secret },
  });
  return NextResponse.json({ secret });
}
