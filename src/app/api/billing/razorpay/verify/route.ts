import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";

/**
 * POST /api/billing/razorpay/verify
 *
 * Called by the client immediately after the Razorpay modal reports
 * successful payment. Instead of trusting the client alone or waiting
 * for the webhook, we fetch the subscription state directly from
 * Razorpay and flip the DB if it's active.
 *
 * Webhook still runs as the source of truth for later events (renewal,
 * cancellation, payment.failed). This endpoint just closes the "user
 * just paid, is stuck on Free" window.
 */
export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subRow = await prisma.subscription.findUnique({
    where: { workspaceId: auth.workspace.id },
  });

  if (!subRow?.razorpaySubscriptionId) {
    return NextResponse.json(
      { error: "No pending Razorpay subscription for this workspace" },
      { status: 400 }
    );
  }

  try {
    const razorpay = getRazorpay();
    // Fetch the authoritative subscription state from Razorpay.
    const remote = await razorpay.subscriptions.fetch(
      subRow.razorpaySubscriptionId
    );

    const activeStatuses = new Set(["active", "authenticated", "charged"]);
    const isActive = activeStatuses.has(String(remote.status));

    if (!isActive) {
      return NextResponse.json({
        plan: subRow.plan,
        razorpayStatus: remote.status,
        message: "Subscription not yet active. Please wait a moment and refresh.",
      });
    }

    const currentStart =
      typeof remote.current_start === "number"
        ? new Date(remote.current_start * 1000)
        : null;
    const currentEnd =
      typeof remote.current_end === "number"
        ? new Date(remote.current_end * 1000)
        : null;

    await prisma.subscription.update({
      where: { id: subRow.id },
      data: {
        plan: "PRO",
        status: "ACTIVE",
        currentPeriodStart: currentStart,
        currentPeriodEnd: currentEnd,
      },
    });

    return NextResponse.json({
      plan: "PRO",
      razorpayStatus: remote.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("[razorpay/verify] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
