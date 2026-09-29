import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { runLeadScan } from "@/lib/leads/run-scan";

/**
 * POST /api/admin/leads/scan — the "[Run Scan Now]" button (spec
 * section 9). Runs the full fetch→classify→inspect→score pipeline
 * synchronously and returns the resulting stats. Bounded inside
 * run-scan.ts so this stays within a normal serverless function
 * timeout; a genuinely larger/scheduled crawl belongs in
 * /api/cron/leads-scan instead of raising these bounds.
 */
export async function POST() {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const stats = await runLeadScan(admin.email);
    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    console.error("[admin/leads/scan] failed:", err);
    return NextResponse.json({ error: "scan_failed" }, { status: 500 });
  }
}
