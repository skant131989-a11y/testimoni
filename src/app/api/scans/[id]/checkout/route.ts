import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";

/**
 * POST /api/scans/[id]/checkout
 *
 * Creates a one-time Razorpay Order (not a subscription — no
 * pre-configured plan needed) for either the Quick Scan or Deep
 * Report unlock. No auth; tied to the email the visitor types in.
 * The client opens the Razorpay Checkout modal with the returned
 * order_id, then calls /verify on success.
 */

const BODY = z.object({
  email: z.string().email().max(200),
  tier: z.enum(["quick", "deep"]),
  currency: z.enum(["INR", "USD"]).optional(),
});

// Minor units — paise for INR, cents for USD. Configuration-driven
// so pricing can be experimented with without a code change.
const PRICE = {
  quick: {
    INR: Number(process.env.SCAN_QUICK_PRICE_INR || 74900), // ~$9
    USD: Number(process.env.SCAN_QUICK_PRICE_USD || 900),
  },
  deep: {
    INR: Number(process.env.SCAN_DEEP_PRICE_INR || 158100), // ~$19
    USD: Number(process.env.SCAN_DEEP_PRICE_USD || 1900),
  },
} as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  const scan = await prisma.urlScan.findUnique({ where: { id } });
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const currency = body.currency ?? "INR";
  const amount = PRICE[body.tier][currency];
  const unlockToken = crypto.randomBytes(24).toString("hex");

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: scan.id,
      notes: { scanId: scan.id, email: body.email, tier: body.tier },
    });

    await prisma.scanPurchase.create({
      data: {
        scanId: scan.id,
        email: body.email,
        amount,
        currency,
        tier: body.tier === "quick" ? "QUICK" : "DEEP",
        razorpayOrderId: order.id,
        unlockToken,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      order_id: order.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount,
      currency,
    });
  } catch (err: unknown) {
    let message = "Checkout failed";
    if (err instanceof Error) message = err.message;
    else if (err && typeof err === "object") {
      const anyErr = err as { error?: { description?: string }; message?: string };
      message = anyErr.error?.description || anyErr.message || message;
    }
    console.error("[scans/checkout] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
