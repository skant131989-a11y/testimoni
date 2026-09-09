import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  getDbUserWithWorkspace,
  loadDbUserWithWorkspaceFresh,
} from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { availablePlatforms } from "@/lib/review-sources/registry";
import { ReviewSourcesClient } from "./client";

export const metadata: Metadata = {
  title: "Review sources — Testimoni",
  description:
    "Auto-sync reviews from App Store, Play Store, Product Hunt, and Chrome Web Store to your Wall of Love.",
};

/**
 * Sources dashboard page. Server component — fetches the connected
 * sources + plan info, hands off to the client for interactive
 * connect/sync flows.
 */
export default async function ReviewSourcesPage() {
  const dbUser =
    (await getDbUserWithWorkspace()) ?? (await loadDbUserWithWorkspaceFresh());
  const membership = dbUser?.workspaceMembers[0];
  if (!membership) redirect("/login");

  const plan = getEffectivePlan(
    membership.workspace.slug,
    membership.workspace.subscription?.plan,
  );

  const sources = await prisma.reviewSource.findMany({
    where: { workspaceId: membership.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ReviewSourcesClient
      initialSources={JSON.parse(JSON.stringify(sources))}
      isPro={plan === "PRO"}
      platforms={availablePlatforms()}
    />
  );
}
