import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildFull, buildQuick, buildTeaser, type ScanResult } from "@/lib/scan-report";

/**
 * GET /api/scans/[id]?t=<unlockToken>
 *
 * Re-fetch a previously-run scan. No auth — access to the Quick/Deep
 * report is controlled entirely by whether `t` matches a PAID
 * ScanPurchase row for this scan (and which tier that purchase was),
 * so the same URL works for a return visit (from the unlocked-report
 * email, or the buyer's own localStorage) on any device.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scan = await prisma.urlScan.findUnique({ where: { id } });
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const result = scan.resultJson as unknown as ScanResult;
  const token = req.nextUrl.searchParams.get("t");

  if (token) {
    const purchase = await prisma.scanPurchase.findFirst({
      where: { scanId: scan.id, unlockToken: token, status: "PAID" },
    });
    if (purchase) {
      const built = purchase.tier === "QUICK" ? buildQuick(result) : buildFull(result);
      return NextResponse.json({ id: scan.id, ...built, unlockToken: purchase.unlockToken });
    }
  }

  return NextResponse.json({ id: scan.id, ...buildTeaser(result) });
}
