import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  getDbUserWithWorkspace,
  loadDbUserWithWorkspaceFresh,
} from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { WallScoreClient } from "./client";

export const metadata: Metadata = {
  title: "Wall Score — Testimoni",
  description:
    "How strong is your Wall of Love? A 0-100 audit across volume, diversity, video, recency, verification, and ratings — with specific next steps.",
};

export default async function WallScorePage() {
  const dbUser =
    (await getDbUserWithWorkspace()) ?? (await loadDbUserWithWorkspaceFresh());
  const membership = dbUser?.workspaceMembers[0];
  if (!membership) redirect("/login");

  const plan = getEffectivePlan(
    membership.workspace.slug,
    membership.workspace.subscription?.plan
  );

  // Last 12 audits — enough to draw a trend line without paging
  // the query result. Ordered oldest-first so the client can plot
  // directly without reversing.
  const auditsDesc = await prisma.wallScoreAudit.findMany({
    where: { workspaceId: membership.workspaceId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const audits = [...auditsDesc].reverse();

  const totalAudits = await prisma.wallScoreAudit.count({
    where: { workspaceId: membership.workspaceId },
  });

  return (
    <WallScoreClient
      initialAudits={JSON.parse(JSON.stringify(audits))}
      totalAudits={totalAudits}
      plan={plan}
      workspaceName={membership.workspace.name}
    />
  );
}
