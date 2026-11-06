import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbUserWithWorkspace } from "@/lib/session";
import { createRequests, parseEntries } from "@/lib/requests";

const BODY = z.object({
  entries: z.string().min(3).max(10_000),
  delayDays: z.number().int().min(0).max(14).optional(),
});

/**
 * POST /api/requests — send testimonial requests to a pasted list of
 * customers (one per line). Dashboard use; the webhook is for automation.
 */
export async function POST(req: Request) {
  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Paste at least one email address." }, { status: 400 });
  }

  const entries = parseEntries(body.entries);
  if (entries.length === 0) {
    return NextResponse.json({ error: "Paste at least one email address." }, { status: 400 });
  }

  const result = await createRequests({
    workspaceId: member.workspaceId,
    entries,
    delayDays: body.delayDays ?? 0,
    source: "manual",
  });
  return NextResponse.json(result);
}
