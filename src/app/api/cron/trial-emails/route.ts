import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/send";
import { trialEmail, type TrialKind } from "@/lib/emails/trial";
import { canCreateOutreachUnsubscribeToken, outreachUnsubscribeUrl } from "@/lib/leads/outreach-unsubscribe";

/**
 * GET /api/cron/trial-emails (daily)
 *
 * Two reminders for people on the 14-day Pro trial: when 4 days are left
 * and when 1 day is left. Skips anyone who has since paid, and anyone on
 * the suppression list. Each person gets each email once (LifecycleEmail is
 * unique per user and kind). Same switch as the onboarding emails:
 * nothing is sent unless LIFECYCLE_EMAILS_ENABLED=1; ?dryRun=1 only lists.
 */
const DAY = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const enabled =
    process.env.LIFECYCLE_EMAILS_ENABLED === "1" && Boolean(process.env.RESEND_API_KEY) && canCreateOutreachUnsubscribeToken();
  const dryRun = !enabled || new URL(req.url).searchParams.get("dryRun") === "1";
  const now = Date.now();

  const windows: { kind: TrialKind; from: Date; to: Date }[] = [
    { kind: "trial_day10", from: new Date(now + 3 * DAY), to: new Date(now + 4 * DAY) },
    { kind: "trial_day13", from: new Date(now), to: new Date(now + 1 * DAY) },
  ];

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email.toLowerCase())
  );

  const report: { kind: string; action: string }[] = [];
  for (const w of windows) {
    const trials = await prisma.proTrial.findMany({ where: { endsAt: { gt: w.from, lte: w.to } } });
    for (const t of trials) {
      const sub = await prisma.subscription.findUnique({ where: { workspaceId: t.workspaceId } });
      // Paid during the trial, or already ended: nothing to remind about.
      if (!sub || sub.plan === "FREE" || sub.stripeSubscriptionId || sub.razorpaySubscriptionId) {
        report.push({ kind: w.kind, action: "skipped: not on an active trial" });
        continue;
      }
      const user = await prisma.user.findUnique({ where: { id: t.userId }, select: { id: true, email: true, name: true } });
      if (!user || suppressed.has(user.email.toLowerCase())) {
        report.push({ kind: w.kind, action: "skipped: unsubscribed or missing" });
        continue;
      }
      const already = await prisma.lifecycleEmail.findUnique({
        where: { userId_kind: { userId: user.id, kind: w.kind } },
        select: { id: true },
      });
      if (already) {
        report.push({ kind: w.kind, action: "skipped: already sent" });
        continue;
      }
      if (dryRun) {
        report.push({ kind: w.kind, action: "would send" });
        continue;
      }
      const [testimonials, audits] = await Promise.all([
        prisma.testimonial.count({ where: { workspaceId: t.workspaceId } }),
        prisma.proofAudit.count({ where: { workspaceId: t.workspaceId, createdAt: { gte: t.startedAt } } }),
      ]);
      const { subject, html, text } = trialEmail(w.kind, {
        name: user.name,
        testimonials,
        audits,
        unsubscribeUrl: outreachUnsubscribeUrl(user.email),
      });
      const res = await sendEmail({
        to: user.email,
        subject,
        html,
        text,
        replyTo: "hello@testimoni.io",
        from: "Neha from Testimoni <hello@testimoni.io>",
      });
      if (res.ok) {
        await prisma.lifecycleEmail.create({ data: { userId: user.id, kind: w.kind } });
        report.push({ kind: w.kind, action: "sent" });
      } else {
        report.push({ kind: w.kind, action: `failed: ${res.error ?? "unknown"}` });
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
