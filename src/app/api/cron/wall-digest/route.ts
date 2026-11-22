import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/send";
import { wallDigestEmail } from "@/lib/emails/wall-digest";
import { canCreateOutreachUnsubscribeToken, outreachUnsubscribeUrl } from "@/lib/leads/outreach-unsubscribe";

/**
 * GET /api/cron/wall-digest (weekly, Monday morning)
 *
 * A short note to each workspace owner who has at least one approved
 * testimonial: views this week, what is new, and one next step. It is only
 * sent when something happened (a view, a new testimonial, or something
 * waiting for approval), and at most once per owner per ISO week (recorded as
 * a LifecycleEmail row "wall_digest:<year>-W<week>"). People on the
 * suppression list are skipped.
 *
 * ?dryRun=1 reports without sending. WALL_DIGEST_DISABLED=1 turns it off.
 */

type Row = {
  workspace_id: string;
  workspace_name: string;
  user_id: string;
  email: string;
  user_name: string | null;
  total: number;
  new_count: number;
  pending: number;
  views: number;
};

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
    process.env.WALL_DIGEST_DISABLED === "1" ||
    !process.env.RESEND_API_KEY ||
    new URL(req.url).searchParams.get("dryRun") === "1";

  const rows = await prisma.$queryRaw<Row[]>`
    select w.id as workspace_id, w.name as workspace_name,
      u.id as user_id, u.email, u.name as user_name,
      (select count(*) from testimonials t where t.workspace_id = w.id and t.status = 'APPROVED')::int as total,
      (select count(*) from testimonials t where t.workspace_id = w.id and t.created_at > now() - interval '7 days')::int as new_count,
      (select count(*) from submissions s join collection_forms f on f.id = s.form_id
         where f.workspace_id = w.id and s.status = 'NEW')::int as pending,
      (select coalesce(sum(a.impressions), 0) from widget_analytics a join widgets wg on wg.id = a.widget_id
         where wg.workspace_id = w.id and a.date >= current_date - 7)::int as views
    from workspaces w
    join workspace_members wm on wm.workspace_id = w.id and wm.role = 'OWNER'
    join users u on u.id = wm.user_id
    where exists (select 1 from testimonials t where t.workspace_id = w.id and t.status = 'APPROVED')
    order by w.created_at asc
    limit 400
  `;

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email.toLowerCase())
  );
  const week = isoWeekKey();
  const kind = `wall_digest:${week}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

  const report: { owner: string; views: number; added: number; pending: number; action: string }[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.user_id)) continue; // one digest per owner even with several workspaces
    seen.add(r.user_id);
    const base = { owner: r.user_id.slice(0, 8), views: r.views, added: r.new_count, pending: r.pending };
    if (r.views === 0 && r.new_count === 0 && r.pending === 0) continue; // nothing to say
    if (suppressed.has(r.email.toLowerCase())) {
      report.push({ ...base, action: "skipped: unsubscribed" });
      continue;
    }
    const already = await prisma.lifecycleEmail.findUnique({
      where: { userId_kind: { userId: r.user_id, kind } },
      select: { id: true },
    });
    if (already) {
      report.push({ ...base, action: "skipped: already sent this week" });
      continue;
    }
    if (dryRun) {
      report.push({ ...base, action: "would send" });
      continue;
    }
    const { subject, html, text } = wallDigestEmail({
      ownerName: r.user_name || "there",
      workspaceName: r.workspace_name,
      views: r.views,
      newThisWeek: r.new_count,
      pending: r.pending,
      totalApproved: r.total,
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
      await prisma.lifecycleEmail.create({ data: { userId: r.user_id, kind } });
      report.push({ ...base, action: "sent" });
    } else {
      report.push({ ...base, action: `failed: ${res.error ?? "unknown"}` });
    }
  }

  return NextResponse.json({ ok: true, dryRun, week, owners: report.length, report });
}
