import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/plan";

/**
 * GET /api/billing/subscription — returns the current subscription + usage
 * for the authenticated workspace. Honors PRO_OVERRIDE_WORKSPACES so
 * founder / demo workspaces render as Pro without a real subscription row.
 */
export async function GET(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [subscription, testimonialCount, widgetCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { workspaceId: auth.workspace.id } }),
    prisma.testimonial.count({ where: { workspaceId: auth.workspace.id } }),
    prisma.widget.count({ where: { workspaceId: auth.workspace.id } }),
  ]);

  const effectivePlan = getEffectivePlan(
    auth.workspace.slug,
    subscription?.plan
  );

  return NextResponse.json({
    subscription: {
      plan: effectivePlan,
      status: subscription?.status ?? "ACTIVE",
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    },
    usage: {
      testimonials: testimonialCount,
      widgets: widgetCount,
    },
  });
}
