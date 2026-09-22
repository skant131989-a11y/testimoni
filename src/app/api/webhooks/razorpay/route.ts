import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";

interface RazorpaySubscription {
  id: string;
  plan_id?: string;
  status?: string;
  current_start?: number;
  current_end?: number;
  end_at?: number;
  customer_id?: string;
}

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscription };
    payment?: {
      entity: { id: string; subscription_id?: string; order_id?: string };
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhookPayload;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.event;
  const subscription = event.payload.subscription?.entity;
  const subscriptionId =
    subscription?.id || event.payload.payment?.entity.subscription_id;

  if (!subscriptionId) {
    // Not a subscription event — check if it's a one-time scan-report
    // order payment instead (backstop for /api/scans/[id]/verify, in
    // case the buyer's tab closed before that call completed).
    const orderId = event.payload.payment?.entity.order_id;
    const paymentId = event.payload.payment?.entity.id;
    if (orderId && (eventName === "payment.captured" || eventName === "order.paid")) {
      const purchase = await prisma.scanPurchase.findUnique({
        where: { razorpayOrderId: orderId },
      });
      if (purchase && purchase.status !== "PAID") {
        await prisma.scanPurchase.update({
          where: { id: purchase.id },
          data: { status: "PAID", razorpayPaymentId: paymentId, paidAt: new Date() },
        });
      }
    }
    return NextResponse.json({ received: true });
  }

  const existing = await prisma.subscription.findFirst({
    where: { razorpaySubscriptionId: subscriptionId },
  });

  if (!existing) {
    // Subscription arrived before our checkout endpoint saved it — ignore
    console.warn("[razorpay/webhook] unknown subscription:", subscriptionId);
    return NextResponse.json({ received: true });
  }

  const updates: Parameters<typeof prisma.subscription.update>[0]["data"] = {};

  switch (eventName) {
    case "subscription.activated":
    case "subscription.charged":
    case "subscription.resumed":
      updates.plan = "PRO";
      updates.status = "ACTIVE";
      if (subscription?.current_start) {
        updates.currentPeriodStart = new Date(subscription.current_start * 1000);
      }
      if (subscription?.current_end) {
        updates.currentPeriodEnd = new Date(subscription.current_end * 1000);
      }
      break;

    case "subscription.paused":
      // No PAUSED value in our enum — treat as past-due until resumed
      updates.status = "PAST_DUE";
      break;

    case "subscription.halted":
      updates.status = "PAST_DUE";
      break;

    case "subscription.pending":
      updates.status = "INCOMPLETE";
      break;

    case "subscription.cancelled":
    case "subscription.completed":
      updates.plan = "FREE";
      updates.status = "CANCELED";
      updates.cancelAtPeriodEnd = true;
      break;

    case "payment.failed":
      updates.status = "PAST_DUE";
      break;

    default:
      // Unhandled event — ack anyway
      return NextResponse.json({ received: true });
  }

  await prisma.subscription.update({
    where: { id: existing.id },
    data: updates,
  });

  return NextResponse.json({ received: true });
}
