import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import ImportClient from "./import-client";

/**
 * Server wrapper that resolves the workspace plan up-front and passes
 * isPro to the client. Lets us render the Pro badge + video-tab
 * upgrade nudge without waiting for a client fetch.
 */
export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              subscription: { select: { plan: true } },
            },
          },
        },
        take: 1,
      },
    },
  });

  const workspace = dbUser?.workspaceMembers[0]?.workspace;
  const isPro = workspace
    ? getEffectivePlan(workspace.slug, workspace.subscription?.plan) === "PRO"
    : false;

  return <ImportClient isPro={isPro} />;
}
