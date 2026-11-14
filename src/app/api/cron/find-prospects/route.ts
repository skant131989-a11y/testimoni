import { NextRequest, NextResponse } from "next/server";
import { findProspects } from "@/lib/leads/find-prospects";

/**
 * GET /api/cron/find-prospects?run=N (four daily entries, see vercel.json)
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
  // Vercel Hobby allows each cron once a day and 60 seconds per run, so the
  // job is four separate daily entries (?run=1..4), each a short, wide run.
  const result = await findProspects({
    budgetMs: 28_000,
    workers: 16,
    target: 12,
    minScore: 60,
    runIndex: Number(url.searchParams.get("run")) || new Date().getUTCHours(),
    dryRun: url.searchParams.get("dryRun") === "1",
  });
  return NextResponse.json({ ok: true, ...result });
}
