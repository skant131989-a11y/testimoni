import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOutreachDraft, type OutreachVariant } from "@/lib/leads/outreach";
import { leadOutreachEmailHtml } from "@/lib/emails/lead-outreach";
import { sendEmail } from "@/lib/emails/send";

/**
 * POST /api/cron/send-combo-batch — batch outreach, CRON_SECRET auth
 * (no browser session needed). NOT on any schedule; run manually.
 *
 * Both templates are used: leads alternate Pro-first / Customer
 * Voice-first down the list. Drafts are built from the deterministic
 * template — this route never calls the Anthropic API.
 *
 *   ?dryRun=1        generate everything, send nothing, return it all.
 *   ?leadIds=a,b,c   ONLY these leads, in this order (what
 *                    scripts/import-prospects.cjs writes to
 *                    outreach-batches/<date>.json). Without it, the
 *                    top-scored unsent leads are used.
 *   ?limit=N         cap (default 30, max 50).
 *
 * Suppressed addresses and leads already contacted are always skipped.
 */
const CONTACTED_STATUSES = ["CONTACTED", "REPLIED", "SIGNUP", "CONVERTED", "IGNORED"];
const VARIANTS: OutreachVariant[] = ["pro", "voice"];

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 30, 50);
  const leadIds = (url.searchParams.get("leadIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email)
  );

  const fetched = await prisma.lead.findMany({
    where: {
      publicBusinessEmail: { not: null },
      status: { notIn: CONTACTED_STATUSES as never[] },
      ...(leadIds.length ? { id: { in: leadIds } } : {}),
    },
    include: { praiseSignals: { orderBy: { foundAt: "desc" }, take: 5 } },
    orderBy: { score: "desc" },
    take: leadIds.length ? leadIds.length : limit,
  });
  if (leadIds.length) fetched.sort((a, b) => leadIds.indexOf(a.id) - leadIds.indexOf(b.id));
  const leads = fetched
    .filter((l) => !suppressed.has(l.publicBusinessEmail!.trim().toLowerCase()))
    .slice(0, limit);

  const results: Array<{
    website: string;
    email: string;
    variant: OutreachVariant;
    subject: string;
    body: string;
    sent: boolean;
    error?: string;
  }> = [];

  for (const [i, lead] of leads.entries()) {
    const variant = VARIANTS[i % VARIANTS.length];
    const { subject, body } = await generateOutreachDraft({
      companyName: lead.companyName || lead.website,
      productName: lead.productName,
      founderName: lead.founderName,
      website: lead.website,
      socialProofReason: lead.socialProofStatus.replace(/_/g, " ").toLowerCase(),
      praiseExcerpts: lead.praiseSignals.map((s) => ({ source: s.source, excerpt: s.excerpt })),
      variant,
      extraContext: lead.notes,
      useClaude: false,
    });

    const email = lead.publicBusinessEmail!;
    if (dryRun) {
      results.push({ website: lead.website, email, variant, subject, body, sent: false });
      continue;
    }

    const html = leadOutreachEmailHtml({
      bodyText: body,
      senderName: "Neha",
      senderEmail: "neha@testimoni.io",
      leadWebsite: lead.website,
      variant,
    });
    const sendResult = await sendEmail({
      to: email,
      subject,
      text: `${body}\n\nNot relevant? Reply "stop" and I won't email you again.`,
      html,
      replyTo: "neha@testimoni.io",
      from: "Neha from Testimoni <neha@testimoni.io>",
    });

    if (sendResult.ok) {
      await prisma.$transaction([
        prisma.leadOutreachDraft.create({
          data: { leadId: lead.id, content: `[${variant}] Subject: ${subject}\n\n${body}` },
        }),
        prisma.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } }),
      ]);
    }
    results.push({ website: lead.website, email, variant, subject, body, sent: sendResult.ok, error: sendResult.error });
  }

  return NextResponse.json({ ok: true, dryRun, count: results.length, results });
}
