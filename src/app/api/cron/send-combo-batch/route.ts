import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOutreachDraft } from "@/lib/leads/outreach";
import { leadOutreachEmailHtml } from "@/lib/emails/lead-outreach";
import { sendEmail } from "@/lib/emails/send";

/**
 * POST /api/cron/send-combo-batch — one-off batch sender, same
 * CRON_SECRET auth pattern as /api/cron/leads-scan (no browser
 * session needed). NOT wired into any schedule; triggered manually
 * for the "find N leads with an email, pitch both offers" request.
 * Reuses the exact same generateOutreachDraft / leadOutreachEmailHtml
 * / sendEmail code the per-lead admin-UI Send button uses — this is
 * not a separate, divergent send path, just a batched caller of it.
 *
 * ?dryRun=1 — generates everything, sends nothing, returns what
 * WOULD be sent to whom, so the batch can be reviewed before any
 * real email leaves. Omit it (or dryRun=0) to actually send.
 * ?limit=N caps how many get processed in one call (default 30).
 */
const CONTACTED_STATUSES = ["CONTACTED", "REPLIED", "SIGNUP", "CONVERTED", "IGNORED"];

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 30, 50);

  const leads = await prisma.lead.findMany({
    where: {
      publicBusinessEmail: { not: null },
      status: { notIn: CONTACTED_STATUSES as never[] },
    },
    include: { praiseSignals: { orderBy: { foundAt: "desc" }, take: 5 } },
    orderBy: { score: "desc" },
    take: limit,
  });

  const results: Array<{
    website: string;
    email: string;
    subject: string;
    body: string;
    sent: boolean;
    error?: string;
  }> = [];

  for (const lead of leads) {
    const { subject, body } = await generateOutreachDraft({
      companyName: lead.companyName || lead.website,
      productName: lead.productName,
      founderName: lead.founderName,
      website: lead.website,
      socialProofReason: lead.socialProofStatus.replace(/_/g, " ").toLowerCase(),
      praiseExcerpts: lead.praiseSignals.map((s) => ({ source: s.source, excerpt: s.excerpt })),
      variant: "pro",
      extraContext: lead.notes,
    });

    const email = lead.publicBusinessEmail!;
    if (dryRun) {
      results.push({ website: lead.website, email, subject, body, sent: false });
      continue;
    }

    const html = leadOutreachEmailHtml({
      bodyText: body,
      senderName: "Neha",
      senderEmail: "neha@testimoni.io",
      leadWebsite: lead.website,
      variant: "pro",
    });
    const sendResult = await sendEmail({
      to: email,
      subject,
      text: body,
      html,
      replyTo: "neha@testimoni.io",
      from: "Neha from Testimoni <neha@testimoni.io>",
    });

    if (sendResult.ok) {
      await prisma.$transaction([
        prisma.leadOutreachDraft.create({
          data: { leadId: lead.id, content: `[combo] Subject: ${subject}\n\n${body}` },
        }),
        prisma.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } }),
      ]);
    }
    results.push({ website: lead.website, email, subject, body, sent: sendResult.ok, error: sendResult.error });
  }

  return NextResponse.json({ ok: true, dryRun, count: results.length, results });
}
