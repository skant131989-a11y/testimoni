import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { generateOutreachDraft, type OutreachVariant } from "@/lib/leads/outreach";

/**
 * POST /api/admin/leads/[id]/prepare-email — builds an editable
 * preview (to/subject/body) for one of three variants, never sends.
 * The UI shows this and only calls send-email after a human clicks
 * Send on what's shown here.
 */
const BODY = z.object({
  variant: z.enum(["wall", "hook", "paid_scan", "combo"]).default("wall"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { id } = await params;
  let variant: OutreachVariant = "wall";
  try {
    variant = BODY.parse(await req.json().catch(() => ({}))).variant;
  } catch {
    // Malformed variant — fall back to the default rather than 400,
    // this is a low-stakes preview request.
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { praiseSignals: { orderBy: { foundAt: "desc" }, take: 5 } },
  });
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { subject, body } = await generateOutreachDraft({
    companyName: lead.companyName || lead.website,
    productName: lead.productName,
    founderName: lead.founderName,
    website: lead.website,
    socialProofReason: lead.socialProofStatus.replace(/_/g, " ").toLowerCase(),
    praiseExcerpts: lead.praiseSignals.map((s) => ({ source: s.source, excerpt: s.excerpt })),
    variant,
    extraContext: lead.notes,
  });

  return NextResponse.json({
    ok: true,
    to: lead.publicBusinessEmail, // null → UI shows "no email found" instead of a send button
    subject,
    body,
    variant,
  });
}
