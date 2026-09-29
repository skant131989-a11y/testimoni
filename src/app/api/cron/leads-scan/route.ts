import { NextRequest, NextResponse } from "next/server";
import { runLeadScan } from "@/lib/leads/run-scan";

/**
 * GET /api/cron/leads-scan
 *
 * Scheduled counterpart to the admin "[Run Scan Now]" button (spec
 * section 9) — same pipeline, same "never sends outreach
 * automatically" guarantee (this only discovers/scores leads, never
 * touches LeadOutreachDraft's send path, because there isn't one).
 *
 * Guarded by CRON_SECRET, same pattern as
 * /api/cron/wall-score-weekly. Not wired into vercel.json's `crons`
 * yet — add an entry there (schedule left to you) once you're happy
 * with a manual scan's results.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const stats = await runLeadScan("cron");
    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    console.error("[cron/leads-scan] failed:", err);
    return NextResponse.json({ error: "scan_failed" }, { status: 500 });
  }
}
