import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const currency = body?.currency === "USD" ? "USD" : "INR";

  const planId =
    currency === "USD"
      ? process.env.RAZORPAY_PRO_PLAN_ID_USD
      : process.env.RAZORPAY_PRO_PLAN_ID_INR || process.env.RAZORPAY_PRO_PLAN_ID;

  if (!planId) {
    return NextResponse.json(
      {
        error: `RAZORPAY_PRO_PLAN_ID_${currency} is not configured`,
      },
      { status: 500 }
    );
  }

  try {
    const razorpay = getRazorpay();

    // Create a Razorpay Subscription. Razorpay's checkout modal opens client-side
    // using this subscription_id and, on payment success, activates it.
    // total_count=60 → auto-continues for 5 years (long enough to feel indefinite)
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 60,
      customer_notify: 1,
      notes: {
        workspaceId: auth.workspace.id,
        workspaceSlug: auth.workspace.slug,
        userEmail: auth.user.email,
      },
    });

    // Persist the pending subscription_id on our side so the webhook can find it.
    await prisma.subscription.update({
      where: { workspaceId: auth.workspace.id },
      data: {
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId: planId,
      },
    });

    return NextResponse.json({
      subscription_id: subscription.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      // Data the client passes to Razorpay.open() for prefill / branding
      prefill: {
        email: auth.user.email,
      },
      workspace_name: auth.workspace.name,
    });
  } catch (err: unknown) {
    // Razorpay's Node SDK doesn't throw native Errors — it throws
    // plain objects like { statusCode, error: { code, description, field } }.
    // Unwrap so the client sees the real reason instead of the "Checkout
    // failed" fallback.
    let message = "Checkout failed";
    let details: unknown = undefined;
    if (err instanceof Error) {
      message = err.message;
    } else if (err && typeof err === "object") {
      const anyErr = err as {
        error?: { description?: string; code?: string; field?: string };
        statusCode?: number;
        message?: string;
      };
      details = anyErr;
      message =
        anyErr.error?.description ||
        anyErr.message ||
        (anyErr.statusCode ? `Razorpay HTTP ${anyErr.statusCode}` : "Checkout failed");
    }
    console.error("[razorpay/checkout] error:", message, details ?? "");
    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}
