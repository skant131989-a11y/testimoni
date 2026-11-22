import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

/**
 * GET /api/inbox/count
 *
 * How many submissions are waiting for approval in the signed-in user's
 * workspace. Powers the Inbox badge in the dashboard sidebar and the dot on
 * the public site's Dashboard button. Always fresh, never cached.
 */
export async function GET(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ pending: 0 }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const pending = await prisma.submission.count({
    where: { status: "NEW", form: { workspaceId: auth.workspace.id } },
  });
  return NextResponse.json({ pending }, { headers: { "Cache-Control": "no-store" } });
}
