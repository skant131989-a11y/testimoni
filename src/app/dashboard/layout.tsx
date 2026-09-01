import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { generateSlug } from "@/lib/utils";
import { getEffectivePlan } from "@/lib/plan";
import { safeDisplayName } from "@/lib/name-utils";

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
    // First-time provisioning. The old implementation ran 6+
    // sequential DB round-trips inside an interactive transaction,
    // which on Supabase Free took 5-9s and made signup feel broken.
    // This version batches every write into a single $transaction
    // array — one round-trip — cutting provisioning to ~400ms.
    //
    // Trick: generate IDs upfront so child rows can reference their
    // parents without waiting for a create to return an id.
    const rawName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "User";
    // Sanitize password-manager-autofill garbage before persisting.
    // See src/lib/name-utils.ts.
    const fullName = safeDisplayName(rawName, authUser.email ?? "");
    // 4-char random suffix guarantees uniqueness without a
    // findUnique-loop probing the DB. Collision odds: 1 in 1.6M.
    const slugSuffix = randomUUID().slice(0, 4);
    const slug = `${generateSlug(fullName)}-${slugSuffix}`;

    const userId = dbUser?.id ?? randomUUID();
    const workspaceId = randomUUID();

    // Only create the User row if it doesn't already exist. Rest of
    // the operations always run.
    const ops = [];
    if (!dbUser) {
      ops.push(
        prisma.user.create({
          data: {
            id: userId,
            supabaseId: authUser.id,
            email: authUser.email!,
            name: fullName,
            avatarUrl: authUser.user_metadata?.avatar_url ?? null,
          },
        })
      );
    }
    ops.push(
      prisma.workspace.create({
        data: {
          id: workspaceId,
          name: `${fullName}'s Workspace`,
          slug,
        },
      }),
      prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId,
          role: "OWNER",
        },
      }),
      prisma.subscription.create({
        data: {
          workspaceId,
          plan: "FREE",
          status: "ACTIVE",
          stripeCustomerId: `cus_placeholder_${userId}`,
        },
      }),
      prisma.collectionForm.create({
        data: {
          workspaceId,
          name: "Customer Feedback",
          slug: "customer-feedback",
          headline: "Share your experience",
          description: `We'd love to hear what you think about ${fullName}'s work.`,
        },
      }),
      prisma.widget.create({
        data: {
          workspaceId,
          name: "Homepage Testimonials",
          layout: "GRID",
        },
      })
    );

    await prisma.$transaction(ops);

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
  const plan = getEffectivePlan(workspace.slug, workspace.subscription?.plan);

  // Wall URL for the sidebar link. Uses the workspace's oldest active
  // widget — same "default widget" convention we use elsewhere. Falls
  // back to null if none exists (impossible after signup provisioning
  // but we render defensively).
  const defaultWidget = await prisma.widget.findFirst({
    where: { workspaceId: workspace.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
  const wallUrl = defaultWidget ? `${siteUrl}/w/${defaultWidget.id}` : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceName={workspace.name} plan={plan} wallUrl={wallUrl} />
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
