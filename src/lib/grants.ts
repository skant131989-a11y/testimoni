import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Free-months grants for bundles with another app. Plan checks across
 * the codebase only read `subscription.plan` (never the period end),
 * so a grant sets plan=PRO plus `grantedUntil`, and the expire-grants
 * cron downgrades it once that date passes.
 */

/** Calendar-aware: Jan 31 + 1 month = Feb 28/29, not Mar 3. */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

type Tx = Prisma.TransactionClient;

type ApplyResult =
  | { ok: true; accessUntil: Date }
  | { ok: false; reason: "no_subscription" | "has_active_paid_subscription" };

async function applyToWorkspace(
  tx: Tx,
  workspaceId: string,
  months: number,
  now: Date
): Promise<ApplyResult> {
  const sub = await tx.subscription.findUnique({ where: { workspaceId } });
  if (!sub) return { ok: false, reason: "no_subscription" };

  // A live paid subscription (Razorpay/Stripe, not set to cancel) would
  // have its period end overwritten by the next charge webhook, so the
  // free months would silently vanish. Caller decides what to do.
  const paidAndRenewing =
    !!(sub.razorpaySubscriptionId || sub.stripeSubscriptionId) &&
    sub.plan !== "FREE" &&
    sub.status === "ACTIVE" &&
    !sub.cancelAtPeriodEnd;
  if (paidAndRenewing) return { ok: false, reason: "has_active_paid_subscription" };

  // Stack on top of whatever access is still running (e.g. a previous grant).
  const stillRunning =
    sub.plan !== "FREE" && sub.status === "ACTIVE" && !!sub.currentPeriodEnd && sub.currentPeriodEnd > now;
  const base = stillRunning ? sub.currentPeriodEnd! : now;
  const accessUntil = addMonths(base, months);

  await tx.subscription.update({
    where: { id: sub.id },
    data: {
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodStart: stillRunning ? sub.currentPeriodStart : now,
      currentPeriodEnd: accessUntil,
      grantedUntil: accessUntil,
      cancelAtPeriodEnd: false,
    },
  });
  return { ok: true, accessUntil };
}

export type GrantOutcome =
  | { status: "applied"; accessUntil: Date }
  | { status: "pending" }
  | { status: "duplicate"; previous: { status: "applied" | "pending"; accessUntil: Date | null } }
  | { status: "conflict"; reason: "has_active_paid_subscription" };

export async function grantMonths(input: {
  email: string;
  months: number;
  source?: string;
  externalRef?: string;
}): Promise<GrantOutcome> {
  const email = input.email.trim().toLowerCase();
  const { months, source, externalRef } = input;

  if (externalRef) {
    const prior = await prisma.planGrant.findUnique({ where: { externalRef } });
    if (prior) {
      return {
        status: "duplicate",
        previous: { status: prior.status === "APPLIED" ? "applied" : "pending", accessUntil: prior.accessUntil },
      };
    }
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  const membership = user
    ? await prisma.workspaceMember.findFirst({
        where: { userId: user.id, role: "OWNER" },
        orderBy: { createdAt: "asc" },
        select: { workspaceId: true },
      })
    : null;

  try {
    return await prisma.$transaction(async (tx): Promise<GrantOutcome> => {
      const now = new Date();
      if (membership) {
        const applied = await applyToWorkspace(tx, membership.workspaceId, months, now);
        if (applied.ok) {
          await tx.planGrant.create({
            data: {
              email, months, source, externalRef,
              status: "APPLIED",
              workspaceId: membership.workspaceId,
              appliedAt: now,
              accessUntil: applied.accessUntil,
            },
          });
          return { status: "applied", accessUntil: applied.accessUntil };
        }
        if (applied.reason === "has_active_paid_subscription") {
          return { status: "conflict", reason: applied.reason };
        }
        // no_subscription: half-provisioned account — queue it, it is applied on provisioning.
      }
      await tx.planGrant.create({
        data: { email, months, source, externalRef, status: "PENDING" },
      });
      return { status: "pending" };
    });
  } catch (err) {
    // Two concurrent calls with the same externalRef: the loser hits the unique index.
    if (externalRef && err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const prior = await prisma.planGrant.findUnique({ where: { externalRef } });
      return {
        status: "duplicate",
        previous: {
          status: prior?.status === "APPLIED" ? "applied" : "pending",
          accessUntil: prior?.accessUntil ?? null,
        },
      };
    }
    throw err;
  }
}

/**
 * Called right after a brand-new account is provisioned: applies any
 * grants queued for this email before the user existed. Never throws —
 * a failure here must not break signup; the grants stay PENDING.
 */
export async function claimPendingGrants(email: string | null | undefined, workspaceId: string): Promise<void> {
  if (!email) return;
  try {
    const pending = await prisma.planGrant.findMany({
      where: { email: { equals: email.trim().toLowerCase(), mode: "insensitive" }, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    for (const grant of pending) {
      await prisma.$transaction(async (tx) => {
        const now = new Date();
        const applied = await applyToWorkspace(tx, workspaceId, grant.months, now);
        if (!applied.ok) return;
        await tx.planGrant.update({
          where: { id: grant.id },
          data: { status: "APPLIED", workspaceId, appliedAt: now, accessUntil: applied.accessUntil },
        });
      });
    }
  } catch (err) {
    console.error("[grants] claimPendingGrants failed:", err);
  }
}
