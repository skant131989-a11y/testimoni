import { NextRequest, NextResponse } from "next/server";
import { processDueRequests } from "@/lib/requests";

/**
 * GET /api/cron/testimonial-requests (daily, see vercel.json)
 *
 * Sends testimonial requests that were scheduled for later, sends the
 * one reminder (about 5 days after the first email) and marks requests
 * as replied when the customer submitted the form.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await processDueRequests();
  return NextResponse.json({ ok: true, ...result });
}
