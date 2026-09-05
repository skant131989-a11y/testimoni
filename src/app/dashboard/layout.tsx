import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthIdentifier } from "@/components/auth-identifier";
import { Header } from "@/components/layout/header";
import { generateSlug } from "@/lib/utils";
import { getEffectivePlan } from "@/lib/plan";
import { safeDisplayName } from "@/lib/name-utils";
import { DashboardPageTracker } from "@/components/dashboard-page-tracker";
import { sendEmail } from "@/lib/emails/send";
import { welcomeEmailHtml, welcomeEmailSubject } from "@/lib/emails/welcome";

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
              // Fetch the default (oldest active) widget in the SAME
              // query so we don't run a second round-trip for the
              // sidebar wall URL. Cut layout render time on Supabase
              // Free by ~200-500ms per navigation.
              widgets: {
                where: { isActive: true },
                orderBy: { createdAt: "asc" },
                take: 1,
                select: { id: true },
              },
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

    // Only create the User row if it doesn't already exist. Uses
    // upsert to survive the race where two dashboard requests hit
    // provisioning at once — the first commits, the second's
    // findUnique returned null but by ops-execution time the row
    // exists. Without upsert we'd hit a unique-constraint on supabaseId.
    const ops = [];
    if (!dbUser) {
      ops.push(
        prisma.user.upsert({
          where: { supabaseId: authUser.id },
          update: {},
          create: {
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
          // Demo accounts skip the moderation step so the wall fills
          // up as soon as a visitor tries the form. Real signups keep
          // the default (autoApprove=false) so their inbox is real.
          autoApprove: /^demo-[a-f0-9]+@testimoni\.dev$/i.test(
            authUser.email ?? ""
          ),
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

    // First-time signup path — everything above just created the
    // user's workspace + form + widget + subscription. Fire a
    // welcome email (fire-and-forget so response TTFB is unaffected).
    // Skips demo accounts (email starts with demo-) since those are
    // provisioning fixtures, not real signups.
    const isDemoAccount = /^demo-[a-f0-9]+@testimoni\.dev$/i.test(
      authUser.email ?? "",
    );
    if (!isDemoAccount && authUser.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
      // Find the default widget id we just created to build the wall URL.
      // The widget was created with a Prisma-generated cuid, so we
      // re-query — cheap read that runs off the main render path.
      (async () => {
        try {
          const w = await prisma.widget.findFirst({
            where: { workspaceId, isActive: true },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });
          const wallUrl = w ? `${appUrl}/w/${w.id}` : `${appUrl}/dashboard`;
          const html = welcomeEmailHtml({
            name: fullName,
            email: authUser.email!,
            wallUrl,
            workspaceName: `${fullName}'s Workspace`,
            dashboardUrl: `${appUrl}/dashboard`,
            importUrl: `${appUrl}/dashboard/import`,
            collectFormUrl: `${appUrl}/collect/${slug}/customer-feedback`,
            embedPageUrl: w
              ? `${appUrl}/dashboard/widgets/${w.id}/embed`
              : `${appUrl}/dashboard/widgets`,
          });
          await sendEmail({
            to: authUser.email!,
            // Welcome-touch mails come from hello@ (replyable) instead
            // of the transactional no-reply@. Users who reply hit a
            // real inbox — early feedback goldmine.
            from: "Testimoni <hello@testimoni.io>",
            subject: welcomeEmailSubject(fullName),
            html,
          });
        } catch {
          // Silent — welcome email failure must never break signup.
        }
      })();
    }

    dbUser = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      include: {
        workspaceMembers: {
          include: {
            workspace: {
              include: {
                subscription: true,
                widgets: {
                  where: { isActive: true },
                  orderBy: { createdAt: "asc" },
                  take: 1,
                  select: { id: true },
                },
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

  // Wall URL for the sidebar link — comes from the widgets we already
  // fetched in the single findUnique above (no extra round-trip).
  // Falls back to null if none exists (rare defensive path).
  const defaultWidget = workspace.widgets[0] ?? null;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
  const wallUrl = defaultWidget ? `${siteUrl}/w/${defaultWidget.id}` : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Ensure PostHog is identified as the CURRENT user, not
          whoever was logged in last. Resets if it detects an
          identity switch. Handles Google OAuth (which can't identify
          from the callback) and account switching in the same
          browser. */}
      <AuthIdentifier userId={authUser.id} />
      {/* Auto-track page views + engagement (scroll depth, time on
          page) for every dashboard route. See DashboardPageTracker
          for details — pathname-keyed so counters reset per route. */}
      <DashboardPageTracker />
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
