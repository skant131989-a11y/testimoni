import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { WelcomeClient } from "./welcome-client";

/**
 * First-run onboarding screen — new signups land here instead of the
 * empty dashboard. The pitch: paste a tweet URL, we import it, you have
 * a live wall in 30 seconds.
 *
 * We rely on the parent dashboard layout to auto-provision the workspace
 * + default form + default widget for first-time users. By the time this
 * page's children render, dbUser and its widgets should always exist.
 * If they don't (rare timing edge case), we fall back to a safe empty
 * state rather than redirecting away.
 */
export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let defaultWidgetId: string | null = null;
  let defaultFormUrl: string | null = null;
  let workspaceName = "";

  // For analytics: fire signup_completed on first landing here. We can't
  // fire it from the OAuth handler (Google redirect leaves our origin),
  // so we detect a fresh signup by created_at < 90s and pass the auth
  // provider down to the client.
  const createdAt = authUser?.created_at ? new Date(authUser.created_at).getTime() : 0;
  const isNewSignup = createdAt > 0 && Date.now() - createdAt < 90_000;
  const signupMethod =
    (authUser?.app_metadata?.provider as string | undefined) === "google"
      ? "google"
      : "email";

  if (authUser) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      include: {
        workspaceMembers: {
          include: {
            workspace: {
              include: {
                widgets: {
                  orderBy: { createdAt: "asc" },
                  take: 1,
                  select: { id: true },
                },
                forms: {
                  orderBy: { createdAt: "asc" },
                  take: 1,
                  select: { slug: true },
                },
              },
            },
          },
          take: 1,
        },
      },
    });
    const workspace = dbUser?.workspaceMembers[0]?.workspace;
    if (workspace) {
      defaultWidgetId = workspace.widgets[0]?.id ?? null;
      workspaceName = workspace.name;
      if (workspace.forms[0]) {
        defaultFormUrl = `/collect/${workspace.slug}/${workspace.forms[0].slug}`;
      }
    }
  }

  return (
    <WelcomeClient
      defaultWidgetId={defaultWidgetId}
      defaultFormUrl={defaultFormUrl}
      workspaceName={workspaceName}
      isNewSignup={isNewSignup}
      signupMethod={signupMethod}
      userId={authUser?.id ?? null}
      userEmail={authUser?.email ?? null}
    />
  );
}
