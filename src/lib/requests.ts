import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/send";
import { testimonialRequestEmail } from "@/lib/emails/testimonial-request";
import { reserveMonthly } from "@/lib/scan-limits";
import { PLAN_LIMITS } from "@/lib/constants";
import { getEffectivePlan } from "@/lib/plan";

/**
 * Testimonial requests: email a customer a link to the workspace's
 * collection form, either from the dashboard or from a webhook (Zapier,
 * Make, a Stripe or Shopify automation, your own code). One reminder goes
 * out about 5 days later unless they already submitted or opted out.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const REMIND_AFTER_MS = 5 * DAY_MS;
const DO_NOT_REASK_MS = 90 * DAY_MS;
const MAX_PER_CALL = 50;

export type RequestEntry = { email: string; name?: string | null };

export const requestsSubject = (workspaceId: string) => `req:${workspaceId}`;

export function newHookSecret(): string {
  return "rq_" + randomBytes(18).toString("base64url");
}

/** "a@b.com", "Ana <a@b.com>", "a@b.com, Ana" or "Ana, a@b.com", one per line. */
export function parseEntries(text: string): RequestEntry[] {
  const out: RequestEntry[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bracket = line.match(/^(.*?)<([^>]+)>\s*$/);
    if (bracket) {
      out.push({ email: bracket[2].trim(), name: bracket[1].trim().replace(/^"|"$/g, "") || null });
      continue;
    }
    const parts = line.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
    const email = parts.find((p) => p.includes("@")) ?? line;
    const name = parts.find((p) => !p.includes("@")) ?? null;
    out.push({ email, name });
  }
  return out;
}

type Context = {
  workspaceId: string;
  workspaceName: string;
  slug: string;
  formSlug: string;
  ownerEmail: string | null;
  plan: ReturnType<typeof getEffectivePlan>;
};

async function loadContext(workspaceId: string): Promise<Context | null> {
  const w = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      name: true,
      slug: true,
      subscription: { select: { plan: true } },
      forms: { orderBy: { createdAt: "asc" }, take: 1, select: { slug: true } },
      members: {
        where: { role: "OWNER" },
        take: 1,
        select: { user: { select: { email: true } } },
      },
    },
  });
  if (!w || !w.forms[0]) return null;
  return {
    workspaceId,
    workspaceName: w.name,
    slug: w.slug,
    formSlug: w.forms[0].slug,
    ownerEmail: w.members[0]?.user.email ?? null,
    plan: getEffectivePlan(w.slug, w.subscription?.plan),
  };
}

async function sendOne(
  row: { id: string; email: string; name: string | null; token: string },
  ctx: Context,
  reminder: boolean
): Promise<boolean> {
  const { subject, html, text } = testimonialRequestEmail({
    workspaceName: ctx.workspaceName,
    name: row.name,
    formUrl: `${APP_URL}/collect/${ctx.slug}/${ctx.formSlug}?ref=${row.token}`,
    optOutUrl: `${APP_URL}/api/requests/optout?token=${row.token}`,
    reminder,
  });
  const senderName = ctx.workspaceName.replace(/["<>,]/g, "").slice(0, 60) || "Testimoni";
  const result = await sendEmail({
    to: row.email,
    subject,
    html,
    text,
    replyTo: ctx.ownerEmail ?? undefined,
    from: `${senderName} via Testimoni <hello@testimoni.io>`,
  });
  return result.ok;
}

export async function createRequests(args: {
  workspaceId: string;
  entries: RequestEntry[];
  delayDays: number;
  source: "manual" | "webhook";
}): Promise<{
  queued: number;
  sent: number;
  skipped: { email: string; reason: string }[];
  limitReached: boolean;
}> {
  const ctx = await loadContext(args.workspaceId);
  const result = {
    queued: 0,
    sent: 0,
    skipped: [] as { email: string; reason: string }[],
    limitReached: false,
  };
  if (!ctx) {
    result.skipped.push({ email: "", reason: "workspace has no collection form" });
    return result;
  }

  const limit = PLAN_LIMITS[ctx.plan].requestsPerMonth;
  const seen = new Set<string>();
  const delay = Math.max(0, Math.min(30, Math.floor(args.delayDays || 0)));
  const sendAt = new Date(Date.now() + delay * DAY_MS);

  for (const entry of args.entries.slice(0, MAX_PER_CALL)) {
    const email = entry.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      result.skipped.push({ email: entry.email, reason: "not a valid email" });
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);

    const prior = await prisma.testimonialRequest.findFirst({
      where: {
        workspaceId: args.workspaceId,
        email,
        OR: [{ status: "UNSUBSCRIBED" }, { createdAt: { gt: new Date(Date.now() - DO_NOT_REASK_MS) } }],
      },
      select: { status: true },
    });
    if (prior) {
      result.skipped.push({
        email,
        reason: prior.status === "UNSUBSCRIBED" ? "opted out" : "already asked in the last 90 days",
      });
      continue;
    }
    const submitted = await prisma.submission.findFirst({
      where: { customerEmail: { equals: email, mode: "insensitive" }, form: { workspaceId: args.workspaceId } },
      select: { id: true },
    });
    if (submitted) {
      result.skipped.push({ email, reason: "already submitted a testimonial" });
      continue;
    }

    if (Number.isFinite(limit)) {
      const slot = await reserveMonthly(requestsSubject(args.workspaceId), limit);
      if (!slot.ok) {
        result.limitReached = true;
        break;
      }
    }

    const row = await prisma.testimonialRequest.create({
      data: {
        workspaceId: args.workspaceId,
        email,
        name: entry.name?.trim() || null,
        source: args.source,
        sendAt,
      },
      select: { id: true, email: true, name: true, token: true },
    });
    result.queued++;

    if (delay === 0) {
      const ok = await sendOne(row, ctx, false);
      await prisma.testimonialRequest.update({
        where: { id: row.id },
        data: ok ? { status: "SENT", sentAt: new Date() } : { status: "FAILED" },
      });
      if (ok) result.sent++;
    }
  }
  return result;
}

/** Cron: send requests that are due, then reminders, and notice who replied. */
export async function processDueRequests(): Promise<{ sent: number; reminded: number; replied: number }> {
  const out = { sent: 0, reminded: 0, replied: 0 };
  const contexts = new Map<string, Context | null>();
  const ctxFor = async (id: string) => {
    if (!contexts.has(id)) contexts.set(id, await loadContext(id));
    return contexts.get(id) ?? null;
  };

  const due = await prisma.testimonialRequest.findMany({
    where: { status: "QUEUED", sendAt: { lte: new Date() } },
    orderBy: { sendAt: "asc" },
    take: 40,
    select: { id: true, workspaceId: true, email: true, name: true, token: true },
  });
  for (const row of due) {
    const ctx = await ctxFor(row.workspaceId);
    if (!ctx) {
      await prisma.testimonialRequest.update({ where: { id: row.id }, data: { status: "FAILED" } });
      continue;
    }
    const ok = await sendOne(row, ctx, false);
    await prisma.testimonialRequest.update({
      where: { id: row.id },
      data: ok ? { status: "SENT", sentAt: new Date() } : { status: "FAILED" },
    });
    if (ok) out.sent++;
  }

  const sentBefore = new Date(Date.now() - REMIND_AFTER_MS);
  const waiting = await prisma.testimonialRequest.findMany({
    where: { status: "SENT", reminderSentAt: null, sentAt: { lte: sentBefore, gt: new Date(Date.now() - 60 * DAY_MS) } },
    orderBy: { sentAt: "asc" },
    take: 40,
    select: { id: true, workspaceId: true, email: true, name: true, token: true },
  });
  for (const row of waiting) {
    const replied = await prisma.submission.findFirst({
      where: { customerEmail: { equals: row.email, mode: "insensitive" }, form: { workspaceId: row.workspaceId } },
      select: { id: true },
    });
    if (replied) {
      await prisma.testimonialRequest.update({ where: { id: row.id }, data: { status: "SUBMITTED" } });
      out.replied++;
      continue;
    }
    const ctx = await ctxFor(row.workspaceId);
    if (!ctx) continue;
    const ok = await sendOne(row, ctx, true);
    await prisma.testimonialRequest.update({
      where: { id: row.id },
      data: { reminderSentAt: new Date(), ...(ok ? {} : { status: "FAILED" as const }) },
    });
    if (ok) out.reminded++;
  }
  return out;
}
