import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { generateSlug } from "@/lib/utils";
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

  let dbUser = await prisma.user.findUnique({
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

  if (!dbUser || !dbUser.workspaceMembers[0]) {
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "User";
    const baseSlug = generateSlug(fullName);

    let uniqueSlug = baseSlug;
    let suffix = 1;
    while (await prisma.workspace.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    await prisma.$transaction(async (tx) => {
      const user = dbUser ?? await tx.user.create({
        data: {
          supabaseId: authUser.id,
          email: authUser.email!,
          name: fullName,
          avatarUrl: authUser.user_metadata?.avatar_url ?? null,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${fullName}'s Workspace`,
          slug: uniqueSlug,
        },
      });

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      await tx.subscription.create({
        data: {
          workspaceId: workspace.id,
          plan: "FREE",
          status: "ACTIVE",
          stripeCustomerId: `cus_placeholder_${user.id}`,
        },
      });
    });

    dbUser = await prisma.user.findUnique({
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

    if (!dbUser || !dbUser.workspaceMembers[0]) {
      redirect("/login");
    }
  }

  const workspace = dbUser.workspaceMembers[0].workspace;
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
