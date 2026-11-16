import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDbUserWithWorkspace } from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { auditSite } from "@/lib/proof-placement";

/**
 * POST /api/proof-placement/audit
 *
 * Reads the caller's own website and reports which pages show no customer
 * proof and which quotes from their wall fit each page. Free: 1 audit.
 * Pro: unlimited (10 a day to keep crawling reasonable).
 */
const BODY = z.object({ url: z.string().trim().min(3).max(300) });

export async function POST(req: NextRequest) {
  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspace = member.workspace;

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Enter your website address." }, { status: 400 });
  }

  const plan = getEffectivePlan(workspace.slug, workspace.subscription?.plan);
  const limits = PLAN_LIMITS[plan];

  if (Number.isFinite(limits.maxProofAudits)) {
    const prior = await prisma.proofAudit.count({ where: { workspaceId: workspace.id } });
    if (prior >= limits.maxProofAudits) {
      return NextResponse.json(
        {
          error: "audit_limit_reached",
          message: "The free plan includes 1 proof placement audit. Upgrade to Pro to re-run it whenever you change your site or add testimonials.",
        },
        { status: 402 }
      );
    }
  } else {
    const today = await prisma.proofAudit.count({
      where: { workspaceId: workspace.id, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    if (today >= 10) {
      return NextResponse.json({ error: "You've run 10 audits today. Try again tomorrow." }, { status: 429 });
    }
  }

  const testimonials = await prisma.testimonial.findMany({ where: { workspaceId: workspace.id } });

  let result;
  try {
    result = await auditSite(body.url, testimonials);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The audit failed. Try again." },
      { status: 422 }
    );
  }

  const audit = await prisma.proofAudit.create({
    data: { workspaceId: workspace.id, siteUrl: result.siteUrl, result: result as unknown as object },
  });
  // Remember the site so next time the box is filled in.
  if (!workspace.websiteUrl) {
    await prisma.workspace.update({ where: { id: workspace.id }, data: { websiteUrl: result.siteUrl.slice(0, 400) } });
  }

  return NextResponse.json({ id: audit.id, result });
}
