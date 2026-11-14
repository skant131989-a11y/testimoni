import { NextRequest, NextResponse } from "next/server";
import { findProspects } from "@/lib/leads/find-prospects";

/**
 * GET /api/cron/find-prospects (a few times a day, see vercel.json)
 *
 * Finds businesses that need social proof and can pay, and queues them for
 * the 8 pm sender. It never sends email, so it is always live (use
 * ?dryRun=1 to look without saving). Each run is time-boxed to fit the
 * function limit; several runs a day add up to a full day's batch.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const result = await findProspects({
    budgetMs: 70_000,
    target: 15,
    minScore: 60,
    runIndex: new Date().getUTCHours(),
    dryRun: url.searchParams.get("dryRun") === "1",
  });
  return NextResponse.json({ ok: true, ...result });
}
