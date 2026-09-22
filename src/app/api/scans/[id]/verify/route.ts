import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOrderPaymentSignature } from "@/lib/razorpay";
import { sendEmail } from "@/lib/emails/send";
import { scanReportEmailHtml, scanReportEmailSubject } from "@/lib/emails/scan-report-email";
import { absoluteUrl } from "@/lib/utils";
import { buildFull, buildQuick, type ScanResult } from "@/lib/scan-report";

function buildForTier(tier: "QUICK" | "DEEP", result: ScanResult) {
  return tier === "QUICK" ? buildQuick(result) : buildFull(result);
}

/**
 * POST /api/scans/[id]/verify
 *
 * Called right after the Razorpay Checkout modal reports success.
 * Verifies the payment signature server-side, flips the
 * ScanPurchase to PAID, emails the buyer a durable (no-login) link
 * back to the full report, and returns the full report immediately
 * so the page can unlock in place without waiting on email.
 *
 * The webhook at /api/webhooks/razorpay is the backstop source of
 * truth if this call never fires (tab closed mid-payment) — same
 * belt-and-suspenders pattern as the existing subscription verify
 * endpoint.
 */

const BODY = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });
  }

  const purchase = await prisma.scanPurchase.findUnique({
    where: { razorpayOrderId: body.razorpay_order_id },
  });
  if (!purchase || purchase.scanId !== id) {
    return NextResponse.json({ error: "No matching order for this scan" }, { status: 400 });
  }

  const scan = await prisma.urlScan.findUnique({ where: { id } });
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const result = scan.resultJson as unknown as ScanResult;

  // Already verified (retry / double-click) — just return the report.
  if (purchase.status === "PAID") {
    return NextResponse.json({
      id: scan.id,
      ...buildForTier(purchase.tier, result),
      unlockToken: purchase.unlockToken,
    });
  }

  const valid = verifyOrderPaymentSignature(
    body.razorpay_order_id,
    body.razorpay_payment_id,
    body.razorpay_signature
  );
  if (!valid) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  await prisma.scanPurchase.update({
    where: { id: purchase.id },
    data: {
      status: "PAID",
      razorpayPaymentId: body.razorpay_payment_id,
      paidAt: new Date(),
    },
  });

  const reportUrl = absoluteUrl(`/tools/customer-voice/${scan.id}?t=${purchase.unlockToken}`);
  // Fire-and-forget — sendEmail never throws, and the buyer already
  // has the unlocked page in front of them regardless of email status.
  sendEmail({
    to: purchase.email,
    from: "Testimoni <hello@testimoni.io>",
    subject: scanReportEmailSubject(scan.brand, purchase.tier),
    html: scanReportEmailHtml({ brand: scan.brand, reportUrl, tier: purchase.tier }),
  }).catch((err) => console.warn("[scans/verify] email send failed:", err));

  return NextResponse.json({
    id: scan.id,
    ...buildForTier(purchase.tier, result),
    unlockToken: purchase.unlockToken,
  });
}
