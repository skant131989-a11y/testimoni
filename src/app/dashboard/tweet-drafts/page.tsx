import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  getDbUserWithWorkspace,
  loadDbUserWithWorkspaceFresh,
} from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { isProviderConfigured } from "@/lib/social-oauth";
import { SOCIAL_AUTO_POST_ENABLED } from "@/lib/feature-flags";
import { TweetDraftsClient } from "./client";

export const metadata: Metadata = {
  title: "Tweet drafts — Testimoni",
  description:
    "Turn every approved testimonial into 3 tweet drafts. Copy them, open a compose window, or auto-post to X and LinkedIn.",
};

export default async function TweetDraftsPage() {
  const dbUser =
    (await getDbUserWithWorkspace()) ?? (await loadDbUserWithWorkspaceFresh());
  const membership = dbUser?.workspaceMembers[0];
  if (!membership) redirect("/login");

  const plan = getEffectivePlan(
    membership.workspace.slug,
    membership.workspace.subscription?.plan
  );

  // Only approved testimonials with text content are draftable.
  // Exclude TWITTER + LINKEDIN sourced testimonials — re-tweeting
  // your own reply-of-a-reply is spammy.
  const testimonials = await prisma.testimonial.findMany({
    where: {
      workspaceId: membership.workspace.id,
      status: "APPROVED",
      content: { not: null },
      NOT: [{ source: "TWITTER" }, { source: "LINKEDIN" }],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      content: true,
      customerName: true,
      customerTitle: true,
      customerAvatar: true,
      source: true,
      createdAt: true,
    },
  });

  const socialAccounts = SOCIAL_AUTO_POST_ENABLED
    ? await prisma.socialAccount.findMany({
        where: { workspaceId: membership.workspace.id },
        select: { provider: true, handle: true },
      })
    : [];

  return (
    <TweetDraftsClient
      testimonials={JSON.parse(JSON.stringify(testimonials))}
      plan={plan}
      socialAccounts={socialAccounts}
      autoPostEnabled={SOCIAL_AUTO_POST_ENABLED}
      providerConfig={{
        twitter: SOCIAL_AUTO_POST_ENABLED && isProviderConfigured("TWITTER"),
        linkedin: SOCIAL_AUTO_POST_ENABLED && isProviderConfigured("LINKEDIN"),
      }}
    />
  );
}
