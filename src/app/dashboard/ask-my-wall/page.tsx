import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  getDbUserWithWorkspace,
  loadDbUserWithWorkspaceFresh,
} from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { AskMyWallClient } from "./client";

export const metadata: Metadata = {
  title: "Ask My Wall — Testimoni",
  description:
    "Embed an AI chatbot on your site that answers visitor questions using your real customer testimonials — grounded, cited, never made-up.",
};

export default async function AskMyWallPage() {
  const dbUser =
    (await getDbUserWithWorkspace()) ?? (await loadDbUserWithWorkspaceFresh());
  const membership = dbUser?.workspaceMembers[0];
  if (!membership) redirect("/login");

  const plan = getEffectivePlan(
    membership.workspace.slug,
    membership.workspace.subscription?.plan
  );

  const config = await prisma.askMyWallConfig.findUnique({
    where: { workspaceId: membership.workspaceId },
  });

  const testimonialCount = await prisma.testimonial.count({
    where: { workspaceId: membership.workspaceId, status: "APPROVED" },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

  return (
    <AskMyWallClient
      initialActive={config?.isActive ?? false}
      workspaceSlug={membership.workspace.slug}
      plan={plan}
      testimonialCount={testimonialCount}
      baseUrl={baseUrl}
    />
  );
}
