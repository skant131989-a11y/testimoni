import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { PlanType } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // Fetch the database user with their workspace membership
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              subscription: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  // If user has no workspace, redirect to onboarding
  const membership = dbUser.workspaceMembers[0];
  if (!membership) {
    redirect("/onboarding");
  }

  const workspace = membership.workspace;
  const plan: PlanType = workspace.subscription?.plan ?? "FREE";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceName={workspace.name} plan={plan} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={dbUser.name}
          userEmail={dbUser.email}
          userAvatarUrl={dbUser.avatarUrl}
          workspaceName={workspace.name}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
