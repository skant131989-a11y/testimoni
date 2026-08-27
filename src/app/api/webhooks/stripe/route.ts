import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
    }
  } catch (err) {
    console.error(`Error processing webhook event ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspaceId;
  if (!workspaceId) {
    console.error("No workspaceId in checkout session metadata");
    return;
  }

  const stripeSubscriptionId = session.subscription as string;
  const stripeCustomerId = session.customer as string;

  // Fetch the subscription to get period details
  const stripeSubscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  await prisma.subscription.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000
      ),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
    update: {
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000
      ),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: false,
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = invoice.subscription as string | null;
  if (!stripeSubscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE" },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = invoice.subscription as string | null;
  if (!stripeSubscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "PAST_DUE" },
    });
  }
}

async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription
) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) return;

  const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
    trialing: "ACTIVE",
    unpaid: "PAST_DUE",
    paused: "ACTIVE",
  };

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: statusMap[stripeSubscription.status] || "ACTIVE",
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000
      ),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription
) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) return;

  // Downgrade to FREE
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: "FREE",
      status: "CANCELED",
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });
}
