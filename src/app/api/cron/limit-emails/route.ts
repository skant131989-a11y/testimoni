import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/send";
import { limitEmail, type LimitKind } from "@/lib/emails/limit";
import { PLAN_LIMITS } from "@/lib/constants";
import { canCreateOutreachUnsubscribeToken, outreachUnsubscribeUrl } from "@/lib/leads/outreach-unsubscribe";

/**
 * GET /api/cron/limit-emails (daily)
 *
 * Free workspaces that are filling up get a short note:
 *   limit_10             10 to 14 testimonials: five spots left
 *   limit_full           at the cap AND something is waiting for approval
 *   limit_full_reminder  still blocked a week after limit_full (at most one a week)
 *
 * Only owners with a confirmed email, never anyone on the suppression list,
 * never workspaces that pay, have a bundle grant, or are on a Pro trial. Each
 * email is recorded in LifecycleEmail so it is sent once per person (the
 * reminder once per ISO week). ?dryRun=1 reports without sending;
 * LIMIT_EMAILS_DISABLED=1 turns the job off.
 */

type Row = {
  user_id: string;
  email: string;
  user_name: string | null;
  testimonials: number;
  pending: number;
  latest_name: string | null;
  no_trial: boolean;
};

const MAX_PER_RUN = 100;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isoWeekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dryRun =
    process.env.LIMIT_EMAILS_DISABLED === "1" ||
    !process.env.RESEND_API_KEY ||
    new URL(req.url).searchParams.get("dryRun") === "1";

  const max = PLAN_LIMITS.FREE.maxTestimonials;

  const rows = await prisma.$queryRaw<Row[]>`
    select u.id as user_id, u.email, u.name as user_name,
      (select count(*) from testimonials t where t.workspace_id = w.id)::int as testimonials,
      (select count(*) from submissions s join collection_forms f on f.id = s.form_id
         where f.workspace_id = w.id and s.status = 'NEW')::int as pending,
      (select s.customer_name from submissions s join collection_forms f on f.id = s.form_id
         where f.workspace_id = w.id and s.status = 'NEW' order by s.created_at desc limit 1) as latest_name,
      (not exists (select 1 from pro_trials pt where pt.workspace_id = w.id)) as no_trial
    from workspaces w
    join workspace_members wm on wm.workspace_id = w.id and wm.role = 'OWNER'
    join users u on u.id = wm.user_id
    join auth.users a on a.id::text = u.supabase_id
    left join subscriptions sub on sub.workspace_id = w.id
    where a.email_confirmed_at is not null
      and coalesce(sub.plan::text, 'FREE') = 'FREE'
      and sub.stripe_subscription_id is null
      and sub.razorpay_subscription_id is null
      and sub.granted_until is null
      and (select count(*) from testimonials t where t.workspace_id = w.id) >= 10
    limit 500
  `;

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email.toLowerCase())
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
  const week = isoWeekKey();
  const now = Date.now();

  const report: { owner: string; kind: string; action: string }[] = [];
  const seen = new Set<string>();
  let handled = 0;
  for (const r of rows) {
    if (handled >= MAX_PER_RUN) break;
    if (seen.has(r.user_id)) continue;
    seen.add(r.user_id);
    if (suppressed.has(r.email.toLowerCase())) continue;

    const sentRows = await prisma.lifecycleEmail.findMany({
      where: { userId: r.user_id, kind: { startsWith: "limit_" } },
      select: { kind: true, sentAt: true },
    });
    const sent = new Map(sentRows.map((s) => [s.kind, s.sentAt]));

    // Pick the single email that applies today (never two on one day).
    let kind: LimitKind | null = null;
    let recordAs = "";
    if (r.testimonials >= max) {
      if (r.pending > 0) {
        if (!sent.has("limit_full")) {
          kind = "limit_full";
          recordAs = "limit_full";
        } else if (
          now - (sent.get("limit_full") as Date).getTime() >= WEEK_MS &&
          !sent.has(`limit_full_reminder:${week}`)
        ) {
          // Not more than one a week, and only while testimonials stay blocked.
          const lastReminder = [...sent.entries()]
            .filter(([k]) => k.startsWith("limit_full_reminder:"))
            .map(([, v]) => v.getTime())
            .sort((a, b) => b - a)[0];
          if (!lastReminder || now - lastReminder >= WEEK_MS) {
            kind = "limit_full_reminder";
            recordAs = `limit_full_reminder:${week}`;
          }
        }
      }
    } else if (!sent.has("limit_10") && !sent.has("limit_full")) {
      kind = "limit_10";
      recordAs = "limit_10";
    }
    if (!kind) continue;
    handled += 1;

    const base = { owner: r.user_id.slice(0, 8), kind };
    if (dryRun) {
      report.push({ ...base, action: "would send" });
      continue;
    }
    const { subject, html, text } = limitEmail(kind, {
      ownerName: r.user_name || "there",
      count: r.testimonials,
      max,
      pending: r.pending,
      pendingName: r.latest_name,
      trialEligible: r.no_trial,
      appUrl,
      unsubscribeUrl: canCreateOutreachUnsubscribeToken() ? outreachUnsubscribeUrl(r.email.toLowerCase()) : null,
    });
    const res = await sendEmail({
      to: r.email,
      subject,
      html,
      text,
      replyTo: "hello@testimoni.io",
      from: "Neha from Testimoni <hello@testimoni.io>",
    });
    if (res.ok) {
      await prisma.lifecycleEmail.create({ data: { userId: r.user_id, kind: recordAs } });
      report.push({ ...base, action: "sent" });
    } else {
      report.push({ ...base, action: `failed: ${res.error ?? "unknown"}` });
    }
  }

  return NextResponse.json({ ok: true, dryRun, week, candidates: rows.length, owners: report.length, report });
}
