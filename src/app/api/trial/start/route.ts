import { NextResponse } from "next/server";
import { getDbUserWithWorkspace } from "@/lib/session";
import { startProTrial } from "@/lib/trial";

/** POST /api/trial/start: starts the 14-day Pro trial for the caller's workspace. */
export async function POST() {
  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!dbUser || !member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await startProTrial(member.workspaceId, dbUser.id);
  if (!res.ok) {
    const message =
      res.reason === "already_used"
        ? "You've already used your free trial."
        : res.reason === "already_pro"
          ? "Your account already has Pro."
          : "We couldn't find your workspace. Refresh and try again.";
    return NextResponse.json({ error: res.reason, message }, { status: 409 });
  }
  return NextResponse.json({ ok: true, endsAt: res.endsAt.toISOString() });
}
