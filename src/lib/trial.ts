import { prisma } from "@/lib/prisma";

/**
 * The 14-day Pro trial: no card, one per workspace, started by the person
 * clicking "Start trial" (so the days aren't spent while nobody is looking).
 *
 * It reuses the grant mechanism: plan=PRO plus grantedUntil, which the
 * expire-grants cron ends. If they pay during the trial, the paid period
 * pushes currentPeriodEnd past grantedUntil and Pro simply carries on.
 */
export const TRIAL_DAYS = 14;

export type StartTrialResult =
  | { ok: true; endsAt: Date }
  | { ok: false; reason: "already_used" | "already_pro" | "no_subscription" };

export async function startProTrial(workspaceId: string, userId: string): Promise<StartTrialResult> {
  const existing = await prisma.proTrial.findUnique({ where: { workspaceId }, select: { id: true } });
  if (existing) return { ok: false, reason: "already_used" };

  const sub = await prisma.subscription.findUnique({ where: { workspaceId } });
  if (!sub) return { ok: false, reason: "no_subscription" };
  // Anyone who is on Pro, has ever paid, or holds a bundle grant doesn't need one.
  if (sub.plan !== "FREE" || sub.stripeSubscriptionId || sub.razorpaySubscriptionId || sub.grantedUntil) {
    return { ok: false, reason: "already_pro" };
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  try {
    await prisma.$transaction([
      prisma.proTrial.create({ data: { workspaceId, userId, startedAt: now, endsAt } }),
      prisma.subscription.update({
        where: { id: sub.id },
        data: {
          plan: "PRO",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: endsAt,
          grantedUntil: endsAt,
          cancelAtPeriodEnd: false,
        },
      }),
    ]);
  } catch {
    // The unique workspace id means a double click can only start one.
    return { ok: false, reason: "already_used" };
  }
  return { ok: true, endsAt };
}
