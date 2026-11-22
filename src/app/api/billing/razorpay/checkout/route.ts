import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";
import { isProVariant, type ProVariant } from "@/lib/pro-offers-config";
import { foundingSeatsLeft, variantPlanId } from "@/lib/pro-offers";

export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tier = body?.tier === "pro_ai" ? "pro_ai" : "pro";
  // Pro is $19/mo USD everywhere unless the INR switch is on
  // (NEXT_PUBLIC_INR_PRICING=1), in which case an Indian browser asks for
  // INR and gets the rupee plan. Pro AI supports INR when requested.
  const inrAllowed = tier === "pro_ai" || process.env.NEXT_PUBLIC_INR_PRICING === "1";
  const currency = inrAllowed && body?.currency === "INR" ? "INR" : "USD";

  // Route to the right plan-ID env var based on tier + currency.
  // Pro AI plans must be created separately in Razorpay (₹1499
  // and $29) with their own plan IDs before this branch works.
  let planId: string | undefined;
  if (tier === "pro_ai") {
    planId =
      currency === "USD"
        ? process.env.RAZORPAY_PRO_AI_PLAN_ID_USD
        : process.env.RAZORPAY_PRO_AI_PLAN_ID_INR ||
          process.env.RAZORPAY_PRO_AI_PLAN_ID;
  } else {
    planId =
      currency === "USD"
        ? process.env.RAZORPAY_PRO_PLAN_ID_USD
        : process.env.RAZORPAY_PRO_PLAN_ID_INR ||
          process.env.RAZORPAY_PRO_PLAN_ID;
  }

  // Yearly and founding options are their own Razorpay plans (US dollars
  // only). The webhook makes any of them Pro, so nothing else differs.
  const variant: ProVariant = tier === "pro" && isProVariant(body?.variant) ? body.variant : "monthly";
  if (variant !== "monthly") {
    const vPlan = variantPlanId(variant);
    if (!vPlan) {
      return NextResponse.json({ error: "That option isn't available right now." }, { status: 400 });
    }
    if (variant === "founding" || variant === "founding_annual") {
      if ((await foundingSeatsLeft()) <= 0) {
        return NextResponse.json({ error: "All the founding spots are taken." }, { status: 409 });
      }
    }
    planId = vPlan;
  }

  if (!planId) {
    const envVar =
      tier === "pro_ai"
        ? `RAZORPAY_PRO_AI_PLAN_ID_${currency}`
        : `RAZORPAY_PRO_PLAN_ID_${currency}`;
    return NextResponse.json(
      { error: `${envVar} is not configured` },
      { status: 500 },
    );
  }

  try {
    const razorpay = getRazorpay();

    // Create a Razorpay Subscription. Razorpay's checkout modal opens client-side
    // using this subscription_id and, on payment success, activates it.
    // total_count=60 → auto-continues for 5 years (long enough to feel indefinite)
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      // 5 billing periods: five years on a yearly plan, five years of months otherwise.
      total_count: variant === "annual" || variant === "founding_annual" ? 5 : 60,
      customer_notify: 1,
      notes: {
        workspaceId: auth.workspace.id,
        workspaceSlug: auth.workspace.slug,
        userEmail: auth.user.email,
        tier,
        variant,
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
