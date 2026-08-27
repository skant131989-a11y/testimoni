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

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: auth.workspace.id },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 404 }
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: absoluteUrl("/dashboard/settings/billing"),
  });

  return NextResponse.json({ url: portalSession.url });
}
