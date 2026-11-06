import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser, getDbUserWithWorkspace } from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";

/**
 * Limits for the Find my praise scan (/api/tools/find-proof).
 *
 *   visitor (no account)  3 scans a day, counted by hashed IP
 *   free account         10 scans a month, counted by account
 *   pro                  30 scans a month, counted by account
 *
 * Counts live in the database (ScanUsage) so they hold across
 * serverless instances. A scan only counts when it really runs: cache
 * hits are free, and a scan that fails is refunded.
 */

export type ScanTier = "visitor" | "free" | "pro";
export type ScanScope = "day" | "month";

export const SCAN_LIMITS: Record<ScanTier, { limit: number; scope: ScanScope }> = {
  visitor: { limit: 3, scope: "day" },
  free: { limit: 10, scope: "month" },
  pro: { limit: 30, scope: "month" },
};

export interface ScanActor {
  tier: ScanTier;
  subject: string;
  period: string;
  limit: number;
  scope: ScanScope;
}

export interface ScanUsage {
  tier: ScanTier;
  used: number;
  limit: number;
  scope: ScanScope;
  remaining: number;
}

function periodFor(scope: ScanScope, now = new Date()): string {
  const iso = now.toISOString();
  return scope === "day" ? iso.slice(0, 10) : iso.slice(0, 7);
}

function ipFrom(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${process.env.CRON_SECRET || "testimoni"}:${ip}`)
    .digest("hex")
    .slice(0, 24);
}

/** Who is asking, and which limit applies to them. */
export async function resolveScanActor(req: Request): Promise<ScanActor> {
  let tier: ScanTier = "visitor";
  let subject = `ip:${hashIp(ipFrom(req))}`;

  try {
    const authUser = await getAuthUser();
    if (authUser) {
      const dbUser = await getDbUserWithWorkspace();
      const workspace = dbUser?.workspaceMembers[0]?.workspace;
      if (dbUser) {
        const plan = getEffectivePlan(workspace?.slug, workspace?.subscription?.plan);
        tier = plan === "FREE" ? "free" : "pro";
        subject = `u:${dbUser.id}`;
      }
    }
  } catch {
    // Treat an unreadable session as a visitor; never block a scan on it.
  }

  const { limit, scope } = SCAN_LIMITS[tier];
  return { tier, subject, period: periodFor(scope), limit, scope };
}

function toUsage(actor: ScanActor, used: number): ScanUsage {
  return {
    tier: actor.tier,
    used,
    limit: actor.limit,
    scope: actor.scope,
    remaining: Math.max(actor.limit - used, 0),
  };
}

/** Current usage without counting anything. */
export async function peekScanUsage(actor: ScanActor): Promise<ScanUsage> {
  try {
    const row = await prisma.scanUsage.findUnique({
      where: { subject_period: { subject: actor.subject, period: actor.period } },
      select: { count: true },
    });
    return toUsage(actor, row?.count ?? 0);
  } catch {
    return toUsage(actor, 0);
  }
}

/**
 * Take one scan from the allowance. The increment is a single atomic
 * upsert, so two requests at once can't both slip under the limit.
 * Fails open if the database is unreachable (the scan then runs
 * uncounted rather than breaking the page).
 */
export async function reserveScan(
  actor: ScanActor
): Promise<{ ok: true; usage: ScanUsage } | { ok: false; usage: ScanUsage }> {
  try {
    const where = { subject_period: { subject: actor.subject, period: actor.period } };
    const row = await prisma.scanUsage.upsert({
      where,
      create: { subject: actor.subject, period: actor.period, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    if (row.count > actor.limit) {
      await prisma.scanUsage.update({ where, data: { count: { decrement: 1 } } });
      return { ok: false, usage: toUsage(actor, actor.limit) };
    }
    return { ok: true, usage: toUsage(actor, row.count) };
  } catch (err) {
    console.warn("[scan-limits] reserve failed, allowing the scan:", err);
    return { ok: true, usage: toUsage(actor, 0) };
  }
}

/** Give a scan back (the search failed before returning anything). */
export async function refundScan(actor: ScanActor): Promise<void> {
  try {
    await prisma.scanUsage.updateMany({
      where: { subject: actor.subject, period: actor.period, count: { gt: 0 } },
      data: { count: { decrement: 1 } },
    });
  } catch {
    // best effort
  }
}

/** Plain-language message for the 429 response. */
export function limitMessage(actor: ScanActor): string {
  if (actor.tier === "visitor") {
    return "You've used your 3 free scans for today. Log in or sign up free to get 10 scans a month.";
  }
  if (actor.tier === "free") {
    return "You've used your 10 scans for this month. Upgrade to Pro for 30 deeper scans a month, or come back on the 1st.";
  }
  return "You've used your 30 scans for this month. They reset on the 1st.";
}

// ── Claude backup search ─────────────────────────────────────────
// When a scan finds nothing, accounts can get one Claude web search as
// a last resort. It costs real money, so it is capped per account
// (Free only) and globally per day.

export const RESCUE = {
  freePerMonth: 3,
  globalPerDay: 30,
  maxQuotes: { free: 3, pro: 10 },
} as const;

async function bump(subject: string, period: string, limit: number): Promise<boolean> {
  const where = { subject_period: { subject, period } };
  const row = await prisma.scanUsage.upsert({
    where,
    create: { subject, period, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  if (row.count > limit) {
    await prisma.scanUsage.update({ where, data: { count: { decrement: 1 } } });
    return false;
  }
  return true;
}

async function unbump(subject: string, period: string): Promise<void> {
  await prisma.scanUsage.updateMany({
    where: { subject, period, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

function rescueKeys(actor: ScanActor) {
  const day = periodFor("day");
  return {
    globalSubject: "rescue:global",
    globalPeriod: day,
    userSubject: `rescue:${actor.subject}`,
    userPeriod: actor.period,
  };
}

/** Take one Claude backup search, if both the account and the day allow. */
export async function reserveRescue(
  actor: ScanActor
): Promise<"ok" | "user_limit" | "global_limit" | "unavailable"> {
  const k = rescueKeys(actor);
  try {
    if (!(await bump(k.globalSubject, k.globalPeriod, RESCUE.globalPerDay))) return "global_limit";
    if (actor.tier === "free") {
      if (!(await bump(k.userSubject, k.userPeriod, RESCUE.freePerMonth))) {
        await unbump(k.globalSubject, k.globalPeriod);
        return "user_limit";
      }
    }
    return "ok";
  } catch (err) {
    console.warn("[scan-limits] rescue reserve failed, skipping Claude:", err);
    return "unavailable";
  }
}

/** Give a backup search back (Claude errored before returning anything). */
export async function refundRescue(actor: ScanActor): Promise<void> {
  const k = rescueKeys(actor);
  try {
    await unbump(k.globalSubject, k.globalPeriod);
    if (actor.tier === "free") await unbump(k.userSubject, k.userPeriod);
  } catch {
    // best effort
  }
}

/** An account's scan usage this month, for the dashboard. */
export async function getAccountScanUsage(
  userId: string,
  tier: "free" | "pro"
): Promise<{ used: number; limit: number }> {
  const { limit, scope } = SCAN_LIMITS[tier];
  try {
    const row = await prisma.scanUsage.findUnique({
      where: { subject_period: { subject: `u:${userId}`, period: periodFor(scope) } },
      select: { count: true },
    });
    return { used: row?.count ?? 0, limit };
  } catch {
    return { used: 0, limit };
  }
}

// ── Monthly counters for other features (Ask My Wall on Free) ────

/** Counter subject for a workspace's Ask My Wall answers. */
export const askSubject = (workspaceId: string) => `ask:${workspaceId}`;

/** Take one from a monthly allowance. Fails open if the database is down. */
export async function reserveMonthly(
  subject: string,
  limit: number
): Promise<{ ok: boolean; used: number }> {
  const period = periodFor("month");
  try {
    const where = { subject_period: { subject, period } };
    const row = await prisma.scanUsage.upsert({
      where,
      create: { subject, period, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    if (row.count > limit) {
      await prisma.scanUsage.update({ where, data: { count: { decrement: 1 } } });
      return { ok: false, used: limit };
    }
    return { ok: true, used: row.count };
  } catch (err) {
    console.warn("[scan-limits] monthly reserve failed, allowing:", err);
    return { ok: true, used: 0 };
  }
}

export async function getMonthlyUsage(subject: string): Promise<number> {
  try {
    const row = await prisma.scanUsage.findUnique({
      where: { subject_period: { subject, period: periodFor("month") } },
      select: { count: true },
    });
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}
