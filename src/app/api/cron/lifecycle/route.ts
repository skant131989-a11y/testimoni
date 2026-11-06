import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/send";
import { lifecycleEmail, type LifecycleKind } from "@/lib/emails/lifecycle";
import { canCreateOutreachUnsubscribeToken, outreachUnsubscribeUrl } from "@/lib/leads/outreach-unsubscribe";

/**
 * GET /api/cron/lifecycle (daily)
 *
 * Two onboarding emails to people who signed up with Google and haven't
 * got a wall going:
 *   day 3: signed up 3 days ago and has 0 testimonials
 *   day 7: signed up 7 days ago and has fewer than 5 testimonials
 *
 * Why only Google sign-ups: email sign-ups could be made with someone
 * else's address before email confirmation was on, and we must never email
 * a stranger. A Google account is the person's own.
 *
 * SAFE BY DEFAULT: nothing is sent unless LIFECYCLE_EMAILS_ENABLED=1 (or
 * with ?dryRun=1 it only reports). Each person gets each email once
 * (LifecycleEmail is unique per user and kind) and anyone on the
 * suppression list, or who unsubscribed, is skipped.
 */

type Row = { id: string; email: string; name: string | null; testimonials: number };

async function candidates(daysAgo: number, maxTestimonials: number): Promise<Row[]> {
  // created between (daysAgo+1) and daysAgo days ago, so each person falls in exactly one daily run
  return prisma.$queryRaw<Row[]>`
    select u.id, u.email, u.name,
      (select count(*) from testimonials t where t.workspace_id = wm.workspace_id)::int as testimonials
    from users u
    join auth.users a on a.id::text = u.supabase_id
    join workspace_members wm on wm.user_id = u.id and wm.role = 'OWNER'
    where a.raw_app_meta_data->>'provider' = 'google'
      and u.created_at <= now() - (${daysAgo}::int * interval '1 day')
      and u.created_at > now() - ((${daysAgo}::int + 1) * interval '1 day')
  ` as unknown as Promise<Row[]>;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const enabled =
    process.env.LIFECYCLE_EMAILS_ENABLED === "1" &&
    Boolean(process.env.RESEND_API_KEY) &&
    canCreateOutreachUnsubscribeToken();
  const dryRun = !enabled || new URL(req.url).searchParams.get("dryRun") === "1";

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email.toLowerCase())
  );

  const plan: { kind: LifecycleKind; rows: Row[] }[] = [
    { kind: "day3_empty_wall", rows: (await candidates(3, 0)).filter((r) => r.testimonials === 0) },
    { kind: "day7_ask_customers", rows: (await candidates(7, 4)).filter((r) => r.testimonials < 5) },
  ];

  const report: { kind: string; email: string; action: string }[] = [];
  for (const { kind, rows } of plan) {
    for (const row of rows) {
      const email = row.email.toLowerCase();
      if (suppressed.has(email)) {
        report.push({ kind, email, action: "skipped: unsubscribed" });
        continue;
      }
      const already = await prisma.lifecycleEmail.findUnique({
        where: { userId_kind: { userId: row.id, kind } },
        select: { id: true },
      });
      if (already) {
        report.push({ kind, email, action: "skipped: already sent" });
        continue;
      }
      if (dryRun) {
        report.push({ kind, email, action: "would send" });
        continue;
      }
      const { subject, html, text } = lifecycleEmail(kind, {
        name: row.name,
        unsubscribeUrl: outreachUnsubscribeUrl(email),
      });
      const res = await sendEmail({
        to: row.email,
        subject,
        html,
        text,
        replyTo: "hello@testimoni.io",
        from: "Neha from Testimoni <hello@testimoni.io>",
      });
      if (res.ok) {
        await prisma.lifecycleEmail.create({ data: { userId: row.id, kind } });
        report.push({ kind, email, action: "sent" });
      } else {
        report.push({ kind, email, action: `failed: ${res.error ?? "unknown"}` });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    note: enabled ? undefined : "LIFECYCLE_EMAILS_ENABLED is not 1 (or Resend/secret missing): dry run only, nothing sent",
    report,
  });
}
