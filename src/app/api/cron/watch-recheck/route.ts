import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/send";
import { scanWatchEmail } from "@/lib/emails/scan-watch";
import { outreachUnsubscribeUrl } from "@/lib/leads/outreach-unsubscribe";
import { runUrlScan } from "@/lib/url-scan";

/**
 * GET /api/cron/watch-recheck (daily)
 *
 * For people who typed their email into "email me when you find something"
 * on an empty result (see /api/watch). Each watched site is scanned again
 * (Tavily + Groq only, never Claude): the first time 2 days after sign-up,
 * then weekly, at most 4 times in 28 days. If more turned up than when they
 * signed up, they get one email and the watch ends.
 *
 * Cost control: at most WATCH_CHECKS_PER_RUN (default 4) sites per run, and
 * a site watched by several people is scanned once. Set
 * WATCH_EMAILS_DISABLED=1 to pause. ?dryRun=1 only lists what is due.
 */

const DAY = 24 * 60 * 60 * 1000;
const MAX_CHECKS = 4;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const started = Date.now();
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const paused = process.env.WATCH_EMAILS_DISABLED === "1" || !process.env.RESEND_API_KEY;
  const perRun = Math.max(1, Number(process.env.WATCH_CHECKS_PER_RUN || 4));
  const now = new Date();

  // Finished or expired watches stop here.
  await prisma.scanWatch.updateMany({ where: { active: true, expiresAt: { lte: now } }, data: { active: false } });

  const due = await prisma.scanWatch.findMany({
    where: {
      active: true,
      OR: [
        { checks: 0, createdAt: { lt: new Date(now.getTime() - 2 * DAY) } },
        { checks: { gt: 0 }, lastCheckedAt: { lt: new Date(now.getTime() - 6 * DAY) } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const byUrl = new Map<string, typeof due>();
  for (const w of due) byUrl.set(w.normalizedUrl, [...(byUrl.get(w.normalizedUrl) ?? []), w]);
  const urls = [...byUrl.keys()].slice(0, perRun);

  if (dryRun || paused) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      note: paused ? "paused (WATCH_EMAILS_DISABLED=1 or no Resend key)" : undefined,
      dueWatches: due.length,
      sitesThisRun: urls,
    });
  }

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email.toLowerCase())
  );

  const report: { site: string; found: number; emailed: number }[] = [];
  for (const url of urls) {
    if (Date.now() - started > 45_000) break;
    const watchers = byUrl.get(url)!;

    // A recheck without Claude can find less than a saved result that had
    // extra help (Claude or a hand-added quote): never let it overwrite one.
    const before = await prisma.urlScan.findUnique({ where: { normalizedUrl: url } });
    const out = await runUrlScan(url, { allowClaude: false }).catch(() => null);
    if (!out) continue;
    const beforeTotal = (before?.resultJson as { totalMentions?: number } | null)?.totalMentions ?? 0;
    if (before && beforeTotal > out.result.totalMentions) {
      await prisma.urlScan.update({
        where: { id: out.id },
        data: { resultJson: before.resultJson as object, provider: before.provider, refreshedAt: before.refreshedAt },
      });
    }
    const best = before && beforeTotal > out.result.totalMentions ? (before.resultJson as unknown as typeof out.result) : out.result;
    const total = best.totalMentions;
    const praise = best.mentions.filter((m) => m.categories.includes("praise") || m.categories.includes("testimonial")).length;

    let emailed = 0;
    for (const w of watchers) {
      const count = w.tool === "find-proof" ? praise : total;
      if (count > w.lastCount && count > 0 && !suppressed.has(w.email.toLowerCase())) {
        const { subject, html, text } = scanWatchEmail({
          brand: best.brand,
          count,
          tool: w.tool as "find-proof" | "customer-voice",
          scanId: out.id,
          siteUrl: url,
          unsubscribeUrl: outreachUnsubscribeUrl(w.email),
        });
        const res = await sendEmail({
          to: w.email,
          subject,
          html,
          text,
          replyTo: "hello@testimoni.io",
          from: "Neha from Testimoni <hello@testimoni.io>",
        });
        if (res.ok) {
          emailed++;
          await prisma.scanWatch.update({ where: { id: w.id }, data: { active: false, notifiedAt: new Date(), lastCount: count, checks: { increment: 1 }, lastCheckedAt: new Date() } });
          continue;
        }
      }
      await prisma.scanWatch.update({
        where: { id: w.id },
        data: { checks: { increment: 1 }, lastCheckedAt: new Date(), active: w.checks + 1 < MAX_CHECKS },
      });
    }
    report.push({ site: url, found: total, emailed });
  }

  return NextResponse.json({ ok: true, report, remainingDue: Math.max(0, byUrl.size - urls.length) });
}
