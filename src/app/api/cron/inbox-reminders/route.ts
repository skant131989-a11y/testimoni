import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/send";
import { inboxReminderEmail } from "@/lib/emails/inbox-reminder";

/**
 * GET /api/cron/inbox-reminders (daily)
 *
 * Testimonials that people left for a workspace and that are still waiting
 * for approval after 24 hours get one reminder email to the owner. One email
 * per owner covers everything waiting. Each submission is reminded about
 * once (recorded as a LifecycleEmail row "inbox_reminder:<submissionId>"), and
 * submissions older than 14 days are left alone, so old forgotten ones never
 * start a flood.
 *
 * ?dryRun=1 reports without sending. INBOX_REMINDERS_DISABLED=1 turns it off.
 */

const MIN_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_OWNERS_PER_RUN = 50;
const SHOWN = 3;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dryRun =
    process.env.INBOX_REMINDERS_DISABLED === "1" ||
    !process.env.RESEND_API_KEY ||
    new URL(req.url).searchParams.get("dryRun") === "1";

  const now = Date.now();
  const subs = await prisma.submission.findMany({
    where: {
      status: "NEW",
      createdAt: { lte: new Date(now - MIN_AGE_MS), gte: new Date(now - MAX_AGE_MS) },
    },
    orderBy: { createdAt: "asc" },
    take: 500,
    select: {
      id: true,
      customerName: true,
      content: true,
      rating: true,
      createdAt: true,
      form: {
        select: {
          workspace: {
            select: {
              id: true,
              name: true,
              members: {
                where: { role: "OWNER" },
                orderBy: { createdAt: "asc" },
                take: 1,
                select: { user: { select: { id: true, email: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });

  // group by workspace owner
  const byOwner = new Map<string, { user: { id: string; email: string; name: string | null }; workspaceName: string; items: typeof subs }>();
  for (const s of subs) {
    const ws = s.form.workspace;
    const user = ws.members[0]?.user;
    if (!user?.email) continue;
    const g = byOwner.get(user.id) ?? { user, workspaceName: ws.name, items: [] as typeof subs };
    g.items.push(s);
    byOwner.set(user.id, g);
  }

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email.toLowerCase())
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

  const report: { owner: string; waiting: number; action: string }[] = [];
  let processed = 0;
  for (const g of byOwner.values()) {
    if (processed >= MAX_OWNERS_PER_RUN) break;
    if (suppressed.has(g.user.email.toLowerCase())) {
      report.push({ owner: g.user.id.slice(0, 8), waiting: g.items.length, action: "skipped: unsubscribed" });
      continue;
    }
    const kinds = g.items.map((i) => `inbox_reminder:${i.id}`);
    const already = await prisma.lifecycleEmail.findMany({
      where: { userId: g.user.id, kind: { in: kinds } },
      select: { kind: true },
    });
    const done = new Set(already.map((a) => a.kind));
    const fresh = g.items.filter((i) => !done.has(`inbox_reminder:${i.id}`));
    if (fresh.length === 0) continue;
    processed += 1;

    if (dryRun) {
      report.push({ owner: g.user.id.slice(0, 8), waiting: fresh.length, action: "would send" });
      continue;
    }

    const oldestDays = Math.max(1, Math.round((now - fresh[0].createdAt.getTime()) / 86_400_000));
    const { subject, html, text } = inboxReminderEmail({
      ownerName: g.user.name || "there",
      workspaceName: g.workspaceName,
      total: fresh.length,
      oldestDays,
      inboxUrl: `${appUrl}/dashboard/inbox`,
      items: fresh.slice(0, SHOWN).map((i) => ({
        name: i.customerName,
        snippet: (i.content ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
        rating: i.rating,
      })),
    });
    const res = await sendEmail({
      to: g.user.email,
      subject,
      html,
      text,
      replyTo: "hello@testimoni.io",
      from: "Neha from Testimoni <hello@testimoni.io>",
    });
    if (res.ok) {
      await prisma.lifecycleEmail.createMany({
        data: fresh.map((i) => ({ userId: g.user.id, kind: `inbox_reminder:${i.id}` })),
        skipDuplicates: true,
      });
      report.push({ owner: g.user.id.slice(0, 8), waiting: fresh.length, action: "sent" });
    } else {
      report.push({ owner: g.user.id.slice(0, 8), waiting: fresh.length, action: `failed: ${res.error ?? "unknown"}` });
    }
  }

  return NextResponse.json({ ok: true, dryRun, owners: report.length, report });
}
