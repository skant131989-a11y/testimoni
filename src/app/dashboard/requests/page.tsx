import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDbUserWithWorkspace, loadDbUserWithWorkspaceFresh } from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { getMonthlyUsage } from "@/lib/scan-limits";
import { newHookSecret, requestsSubject } from "@/lib/requests";
import { RequestsClient } from "./requests-client";

export const metadata: Metadata = {
  title: "Testimonial requests — Testimoni",
  description: "Ask customers for a testimonial by email, by hand or automatically from a webhook.",
};

export default async function RequestsPage() {
  const dbUser = (await getDbUserWithWorkspace()) ?? (await loadDbUserWithWorkspaceFresh());
  const membership = dbUser?.workspaceMembers[0];
  if (!membership) redirect("/login");

  const workspaceId = membership.workspaceId;
  const plan = getEffectivePlan(membership.workspace.slug, membership.workspace.subscription?.plan);
  const limit = PLAN_LIMITS[plan].requestsPerMonth;

  // The webhook URL is created the first time the page is opened.
  const hook =
    (await prisma.requestHook.findUnique({ where: { workspaceId } })) ??
    (await prisma.requestHook.create({ data: { workspaceId, secret: newHookSecret() } }));

  const [rows, used] = await Promise.all([
    prisma.testimonialRequest.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, email: true, name: true, status: true, source: true, sentAt: true, reminderSentAt: true, createdAt: true },
    }),
    getMonthlyUsage(requestsSubject(workspaceId)),
  ]);

  return (
    <RequestsClient
      baseUrl={process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io"}
      initialSecret={hook.secret}
      isFree={plan === "FREE"}
      limit={Number.isFinite(limit) ? limit : null}
      used={used}
      rows={rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        status: r.status,
        source: r.source,
        sentAt: r.sentAt ? r.sentAt.toISOString() : null,
        reminded: !!r.reminderSentAt,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
