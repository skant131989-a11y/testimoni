import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";

/**
 * POST /api/billing/razorpay/cancel
 *
 * Cancels the workspace's Razorpay subscription at the end of the current
 * billing cycle. The user keeps Pro until currentPeriodEnd, then a
 * subscription.cancelled webhook flips them back to Free.
 *
 * Body: { immediate?: boolean } — if true, cancels immediately instead
 * of at cycle end (loses remaining days). Defaults to false.
 */
export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const immediate = body?.immediate === true;

  const subRow = await prisma.subscription.findUnique({
    where: { workspaceId: auth.workspace.id },
  });

  if (!subRow?.razorpaySubscriptionId) {
    return NextResponse.json(
      { error: "No active Razorpay subscription for this workspace" },
      { status: 400 }
    );
  }

  try {
    const razorpay = getRazorpay();
    // cancel_at_cycle_end: 1 means "cancel at the end of the current cycle"
    // (user keeps Pro until then). 0 = cancel immediately.
    await razorpay.subscriptions.cancel(
      subRow.razorpaySubscriptionId,
      immediate ? false : true
    );

    // Reflect the pending cancellation in our DB. Webhook will flip
    // plan to FREE when Razorpay actually cancels.
    await prisma.subscription.update({
      where: { id: subRow.id },
      data: {
        cancelAtPeriodEnd: !immediate,
        ...(immediate ? { plan: "FREE", status: "CANCELED" } : {}),
      },
    });

    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: !immediate,
      immediate,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cancel failed";
    console.error("[razorpay/cancel] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
