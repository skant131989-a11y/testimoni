import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

/**
 * POST /api/admin/leads/[id]/status — the card's status actions
 * ([Mark Contacted], [Ignore], and the implicit progression after
 * outreach is generated). Always a human click; nothing here fires
 * automatically.
 */
const BODY = z.object({
  status: z.enum([
    "NEW",
    "QUALIFIED",
    "DRAFT_READY",
    "CONTACTED",
    "REPLIED",
    "SIGNUP",
    "CONVERTED",
    "IGNORED",
  ]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { id } = await params;
  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const updated = await prisma.lead.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}
