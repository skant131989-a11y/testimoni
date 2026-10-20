import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runOutreachBatch } from "@/lib/leads/send-batch";

/**
 * POST /api/cron/send-combo-batch — manual batch outreach, CRON_SECRET
 * auth. NOT scheduled (the daily scheduled sender is
 * /api/cron/daily-outreach). Both templates alternate down the list;
 * drafts never call the Anthropic API.
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

  const results = await runOutreachBatch(leads, { dryRun });
  return NextResponse.json({ ok: true, dryRun, count: results.length, results });
}
