import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runOutreachBatch } from "@/lib/leads/send-batch";

/**
 * GET /api/cron/daily-outreach — 8:30 pm IST every day (15:00 UTC, see
 * vercel.json). Sends the next batch of QUEUED leads (status
 * DRAFT_READY — scripts/import-prospects.cjs queues the eligible ones
 * each morning), alternating the Pro-first and Customer Voice-first
 * templates. Never calls the Anthropic API.
 *
 * SAFE BY DEFAULT: nothing is emailed unless DAILY_OUTREACH_ENABLED=1.
 * Otherwise (or with ?dryRun=1) it only reports what it WOULD send.
 *
 * Guards: DAILY_OUTREACH_LIMIT per IST day (default 15, counting every
 * outreach email sent that day, so a repeated invocation can't double
 * send); suppressed addresses skipped; a lead flips to CONTACTED only
 * after Resend accepts the email.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function startOfIstDayUtc(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const enabled = process.env.DAILY_OUTREACH_ENABLED === "1";
  const dryRun = !enabled || new URL(req.url).searchParams.get("dryRun") === "1";
  const dailyLimit = Math.min(Number(process.env.DAILY_OUTREACH_LIMIT) || 15, 50);

  const sentToday = await prisma.leadOutreachDraft.count({
    where: { createdAt: { gte: startOfIstDayUtc() } },
  });
  const remaining = Math.max(dailyLimit - sentToday, 0);
  if (remaining === 0) {
    return NextResponse.json({ ok: true, dryRun, note: "daily limit already reached", sentToday, dailyLimit });
  }

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email)
  );
  const queued = await prisma.lead.findMany({
    where: { status: "DRAFT_READY", publicBusinessEmail: { not: null } },
    include: { praiseSignals: { orderBy: { foundAt: "desc" }, take: 5 } },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: remaining * 2,
  });
  const leads = queued
    .filter((l) => !suppressed.has(l.publicBusinessEmail!.trim().toLowerCase()))
    .slice(0, remaining);

  const results = await runOutreachBatch(leads, { dryRun });
  const queueLeft = await prisma.lead.count({ where: { status: "DRAFT_READY", publicBusinessEmail: { not: null } } });

  return NextResponse.json({
    ok: true,
    sending: !dryRun,
    note: enabled ? undefined : "DAILY_OUTREACH_ENABLED is not 1 — dry run only, nothing sent",
    dailyLimit,
    sentToday,
    processed: results.length,
    sent: results.filter((r) => r.sent).length,
    queueLeft,
    results: results.map(({ website, email, variant, sent, error }) => ({ website, email, variant, sent, error })),
  });
}
