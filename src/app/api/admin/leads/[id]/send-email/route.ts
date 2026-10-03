import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { sendEmail } from "@/lib/emails/send";
import { leadOutreachEmailHtml } from "@/lib/emails/lead-outreach";

/**
 * POST /api/admin/leads/[id]/send-email — the ONLY place an outreach
 * message actually leaves this app, and it only ever fires on an
 * explicit human click of "Send" on the preview from /prepare-email
 * (spec: human approval required, never automatic). Takes the
 * possibly-edited to/subject/body straight from that preview — this
 * route doesn't regenerate anything, it sends exactly what's shown.
 */
const BODY = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  variant: z.enum(["pro", "voice"]).default("pro"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { id } = await params;
  let parsed: z.infer<typeof BODY>;
  try {
    parsed = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const html = leadOutreachEmailHtml({
    bodyText: parsed.body,
    senderName: "Neha",
    senderEmail: "neha@testimoni.io",
    leadWebsite: lead.website,
    variant: parsed.variant,
  });

  const result = await sendEmail({
    to: parsed.to,
    subject: parsed.subject,
    text: parsed.body,
    html,
    replyTo: admin.email,
    from: "Neha from Testimoni <neha@testimoni.io>",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "send_failed" }, { status: 502 });
  }

  await prisma.$transaction([
    prisma.leadOutreachDraft.create({
      data: { leadId: lead.id, content: `[${parsed.variant}] Subject: ${parsed.subject}\n\n${parsed.body}` },
    }),
    prisma.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } }),
  ]);

  return NextResponse.json({ ok: true });
}
