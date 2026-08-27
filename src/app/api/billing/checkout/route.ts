import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAuthContext } from "@/lib/auth";
import { absoluteUrl } from "@/lib/utils";

export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured" },
      { status: 500 }
    );
  }

  // Find or create Stripe customer
  let subscription = await prisma.subscription.findUnique({
    where: { workspaceId: auth.workspace.id },
  });

  let stripeCustomerId: string;

  if (subscription?.stripeCustomerId) {
    stripeCustomerId = subscription.stripeCustomerId;
  } else {
    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email: auth.user.email,
      name: auth.user.name || undefined,
      metadata: {
        workspaceId: auth.workspace.id,
        userId: auth.user.id,
      },
    });

    stripeCustomerId = customer.id;

    // Create or update subscription record
    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          workspaceId: auth.workspace.id,
          stripeCustomerId,
          plan: "FREE",
          status: "ACTIVE",
        },
      });
    }
  }

  // Create Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { workspaceId: auth.workspace.id },
    success_url: absoluteUrl("/dashboard/settings/billing?success=true"),
    cancel_url: absoluteUrl("/dashboard/settings/billing"),
  });

  return NextResponse.json({ url: checkoutSession.url });
}
