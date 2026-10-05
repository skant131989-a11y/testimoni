import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/expire-grants — daily. Plan checks never read the
 * period end, so this is what actually ends a granted subscription.
 * A paid Razorpay period pushes currentPeriodEnd past grantedUntil, in
 * which case the grant marker is just cleared and Pro stays.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.subscription.updateMany({
    where: {
      grantedUntil: { lte: now },
      plan: { not: "FREE" },
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { lte: now } }],
    },
    data: { plan: "FREE", status: "ACTIVE", grantedUntil: null, cancelAtPeriodEnd: false },
  });
  const cleared = await prisma.subscription.updateMany({
    where: { grantedUntil: { lte: now }, currentPeriodEnd: { gt: now } },
    data: { grantedUntil: null },
  });

  return NextResponse.json({ ok: true, expired: expired.count, grantMarkerCleared: cleared.count });
}
