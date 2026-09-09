import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { computeWallScore } from "@/lib/wall-score";
import { sendEmail } from "@/lib/emails/send";
import {
  weeklyWallScoreEmailHtml,
  weeklyWallScoreEmailSubject,
} from "@/lib/emails/weekly-wall-score";

/**
 * GET /api/cron/wall-score-weekly
 *
 * Runs weekly (Monday 08:00 IST) via Vercel Cron. For each Pro
 * workspace with wallScoreTracking enabled and Ask My Wall active
 * (proxy for engaged users), computes this week's Wall Score,
 * writes an audit row, compares to last week, and emails the owner.
 *
 * Guarded by CRON_SECRET — Vercel Cron sends it as a Bearer token.
 * Any other caller gets a 401. Idempotent within a week: if an
 * audit was already written in the last 6 days, skip.
 */

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = {
    checked: 0,
    audited: 0,
    emailed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // Only workspaces with a subscription — cheap prefilter.
  const workspaces = await prisma.workspace.findMany({
    where: {
      subscription: { plan: { in: ["PRO", "PRO_AI"] } },
    },
    include: {
      subscription: true,
      askMyWall: true,
      members: {
        where: { role: "OWNER" },
        include: { user: { select: { email: true, name: true } } },
        take: 1,
      },
    },
  });

  const cutoff = new Date(Date.now() - SIX_DAYS_MS);

  for (const w of workspaces) {
    results.checked += 1;
    try {
      const plan = getEffectivePlan(w.slug, w.subscription?.plan);
      if (!PLAN_LIMITS[plan].wallScoreTracking) {
        results.skipped += 1;
        continue;
      }

      // Skip if we already ran one this week.
      const recent = await prisma.wallScoreAudit.findFirst({
        where: { workspaceId: w.id, createdAt: { gte: cutoff } },
      });
      if (recent) {
        results.skipped += 1;
        continue;
      }

      const testimonials = await prisma.testimonial.findMany({
        where: { workspaceId: w.id },
      });
      const result = computeWallScore(testimonials);

      const audit = await prisma.wallScoreAudit.create({
        data: {
          workspaceId: w.id,
          score: result.score,
          breakdown: result.breakdown,
          recommendations: result.recommendations,
          totalTestimonials: result.totalTestimonials,
          approvedCount: result.approvedCount,
          videoCount: result.videoCount,
        },
      });
      results.audited += 1;

      // Delta vs. previous audit
      const previous = await prisma.wallScoreAudit.findFirst({
        where: { workspaceId: w.id, id: { not: audit.id } },
        orderBy: { createdAt: "desc" },
      });
      const delta = previous ? audit.score - previous.score : null;

      // Send email to the owner
      const owner = w.members[0]?.user;
      if (!owner?.email) continue;

      const base = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
      const emailRes = await sendEmail({
        to: owner.email,
        subject: weeklyWallScoreEmailSubject(audit.score, delta),
        html: weeklyWallScoreEmailHtml({
          name: owner.name || "there",
          workspaceName: w.name,
          score: audit.score,
          delta,
          topRecommendation: result.recommendations[0] ?? null,
          totalTestimonials: result.approvedCount,
          wallScoreUrl: `${base}/dashboard/wall-score`,
        }),
      });
      if (emailRes.ok) results.emailed += 1;
    } catch (e) {
      results.errors.push(
        `${w.slug}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  return NextResponse.json(results);
}
