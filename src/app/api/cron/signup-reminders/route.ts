import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/send";
import { signupReminderEmail, type SignupReminderStage } from "@/lib/emails/signup-reminder";
import { signSignupToken } from "@/lib/signup-link-token";
import { outreachUnsubscribeUrl } from "@/lib/leads/outreach-unsubscribe";
import { isGmailDotStuffing } from "@/lib/bot-email";

/**
 * GET /api/cron/signup-reminders (hourly)
 *
 * People who asked for an account with their email but never entered the code
 * get up to two short reminders: the first 2 hours to 7 days after signing up,
 * the second at least 40 hours after the first (and never later than 7 days
 * after signing up). Each is sent once per person (a LifecycleEmail row), they
 * stop the moment the person confirms or signs in, and known bot patterns,
 * unsubscribed addresses and Google sign-ups are skipped.
 *
 * ?dryRun=1 reports without sending. SIGNUP_REMINDERS_DISABLED=1 turns it off.
 */

const MIN_AGE_HOURS = 2;
const MAX_AGE_DAYS = 7;
const GAP_HOURS = 40;
const MAX_PER_RUN = 30;

type Row = { id: string; email: string; created_at: Date };

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dryRun =
    process.env.SIGNUP_REMINDERS_DISABLED === "1" ||
    !process.env.RESEND_API_KEY ||
    new URL(req.url).searchParams.get("dryRun") === "1";

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT u.id::text AS id, u.email, u.created_at
    FROM auth.users u
    WHERE u.email IS NOT NULL
      AND u.email_confirmed_at IS NULL
      AND u.last_sign_in_at IS NULL
      AND COALESCE(u.is_anonymous, false) = false
      AND u.raw_app_meta_data->>'provider' = 'email'
      AND u.created_at <= now() - (${MIN_AGE_HOURS} * interval '1 hour')
      AND u.created_at >= now() - (${MAX_AGE_DAYS} * interval '1 day')
      AND NOT EXISTS (SELECT 1 FROM users a WHERE a.supabase_id = u.id::text)
    ORDER BY u.created_at ASC
    LIMIT 200`;

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email.toLowerCase())
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
  const now = Date.now();

  const report: { who: string; action: string }[] = [];
  let processed = 0;
  for (const r of rows) {
    const who = r.id.slice(0, 8);
    if (processed >= MAX_PER_RUN) break;
    const email = r.email.trim();
    if (isGmailDotStuffing(email)) {
      report.push({ who, action: "skipped: bot pattern" });
      continue;
    }
    if (suppressed.has(email.toLowerCase())) {
      report.push({ who, action: "skipped: unsubscribed" });
      continue;
    }

    const sent = await prisma.lifecycleEmail.findMany({
      where: { userId: r.id, kind: { in: ["signup_nudge_1", "signup_nudge_2"] } },
      select: { kind: true, sentAt: true },
    });
    const first = sent.find((s) => s.kind === "signup_nudge_1");
    const second = sent.find((s) => s.kind === "signup_nudge_2");
    let stage: SignupReminderStage | null = null;
    if (!first) stage = 1;
    else if (!second && now - first.sentAt.getTime() >= GAP_HOURS * 3_600_000) stage = 2;
    if (!stage) continue;
    processed += 1;

    if (dryRun) {
      report.push({ who, action: `would send reminder ${stage}` });
      continue;
    }

    const token = signSignupToken(r.id);
    if (!token) {
      report.push({ who, action: "failed: no signing secret" });
      continue;
    }
    const { subject, html, text } = signupReminderEmail({
      stage,
      openUrl: `${appUrl}/open/${token}`,
      loginUrl: `${appUrl}/login?email=${encodeURIComponent(email)}`,
      unsubscribeUrl: outreachUnsubscribeUrl(email),
    });
    const res = await sendEmail({
      to: email,
      subject,
      html,
      text,
      replyTo: "hello@testimoni.io",
      from: "Neha from Testimoni <hello@testimoni.io>",
    });
    if (res.ok) {
      await prisma.lifecycleEmail.create({ data: { userId: r.id, kind: `signup_nudge_${stage}` } }).catch(() => {});
      report.push({ who, action: `sent reminder ${stage}` });
    } else {
      report.push({ who, action: `failed: ${res.error ?? "unknown"}` });
    }
  }

  return NextResponse.json({ ok: true, dryRun, owners: report.length, report });
}
