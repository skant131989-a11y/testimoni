import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDbUserWithWorkspace, loadDbUserWithWorkspaceFresh } from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { ProofPlacementClient } from "./client";
import type { ProofAuditResult } from "@/lib/proof-placement";

export const metadata: Metadata = {
  title: "Proof placement — Testimoni",
  description: "See which pages on your website have no customer proof, and which of your testimonials belong on each one.",
};

export default async function ProofPlacementPage() {
  const dbUser = (await getDbUserWithWorkspace()) ?? (await loadDbUserWithWorkspaceFresh());
  const membership = dbUser?.workspaceMembers[0];
  if (!membership) redirect("/login");
  const workspace = membership.workspace;

  const plan = getEffectivePlan(workspace.slug, workspace.subscription?.plan);
  const [latest, totalAudits, trial] = await Promise.all([
    prisma.proofAudit.findFirst({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" } }),
    prisma.proofAudit.count({ where: { workspaceId: workspace.id } }),
    prisma.proTrial.findUnique({ where: { workspaceId: workspace.id }, select: { id: true } }),
  ]);
  const sub = workspace.subscription;
  const trialEligible =
    plan === "FREE" && !trial && !sub?.stripeSubscriptionId && !sub?.razorpaySubscriptionId && !sub?.grantedUntil;

  return (
    <ProofPlacementClient
      initial={latest ? (latest.result as unknown as ProofAuditResult) : null}
      defaultUrl={workspace.websiteUrl ?? ""}
      canRun={totalAudits < PLAN_LIMITS[plan].maxProofAudits}
      plan={plan}
      trialEligible={trialEligible}
    />
  );
}
