import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUserWithWorkspace } from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { computeWallScore } from "@/lib/wall-score";

/**
 * POST /api/wall-score/audit
 *
 * Runs a fresh audit for the caller's workspace and persists it.
 * Free plan: 1 audit lifetime (viral score card share). Pro:
 * unlimited. Returns the new audit + delta vs. previous audit
 * so the UI can render "▲ +5 since last week".
 */
export async function POST() {
  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspace = member.workspace;

  const plan = getEffectivePlan(workspace.slug, workspace.subscription?.plan);
  const limits = PLAN_LIMITS[plan];

  // Enforce lifetime cap for Free — Pro is Infinity so this
  // branch is skipped without a special case.
  if (Number.isFinite(limits.maxWallScoreAudits)) {
    const prior = await prisma.wallScoreAudit.count({
      where: { workspaceId: workspace.id },
    });
    if (prior >= limits.maxWallScoreAudits) {
      return NextResponse.json(
        {
          error: "audit_limit_reached",
          message: `Free plan includes ${limits.maxWallScoreAudits} lifetime Wall Score audit. Upgrade to Pro for unlimited audits + weekly reports.`,
        },
        { status: 402 }
      );
    }
  }

  const testimonials = await prisma.testimonial.findMany({
    where: { workspaceId: workspace.id },
  });

  const result = computeWallScore(testimonials);

  const audit = await prisma.wallScoreAudit.create({
    data: {
      workspaceId: workspace.id,
      score: result.score,
      breakdown: result.breakdown,
      recommendations: result.recommendations,
      totalTestimonials: result.totalTestimonials,
      approvedCount: result.approvedCount,
      videoCount: result.videoCount,
    },
  });

  // Look for the previous audit to compute delta. The one we just
  // wrote is skip-1'd out. If none, delta stays null.
  const previous = await prisma.wallScoreAudit.findFirst({
    where: { workspaceId: workspace.id, id: { not: audit.id } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    audit,
    delta: previous ? audit.score - previous.score : null,
    plan,
  });
}
