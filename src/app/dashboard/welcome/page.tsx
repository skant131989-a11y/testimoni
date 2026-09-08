import {
  getAuthUser,
  getDbUserWithWorkspace,
  loadDbUserWithWorkspaceFresh,
} from "@/lib/session";
import { WelcomeClient } from "./welcome-client";

/**
 * First-run onboarding screen — new signups land here instead of the
 * empty dashboard. The pitch: paste a tweet URL, we import it, you have
 * a live wall in 30 seconds.
 *
 * We rely on the parent dashboard layout to auto-provision the workspace
 * + default form + default widget for first-time users. By the time this
 * page renders, dbUser and its widgets should always exist.
 *
 * Both auth and user lookups go through React.cache()-wrapped helpers
 * so the layout's calls are reused — no duplicate Supabase / Prisma
 * round-trips per navigation. The fresh-read fallback covers the
 * first-visit case where provisioning ran after the cache memoized null.
 */
export default async function WelcomePage() {
  const authUser = await getAuthUser();
  const dbUser =
    (await getDbUserWithWorkspace()) ??
    (await loadDbUserWithWorkspaceFresh());

  let defaultWidgetId: string | null = null;
  let defaultFormUrl: string | null = null;
  let workspaceName = "";

  // For analytics: fire signup_completed on first landing here. We can't
  // fire it from the OAuth handler (Google redirect leaves our origin),
  // so we detect a fresh signup by created_at < 90s and pass the auth
  // provider down to the client.
  const createdAt = authUser?.created_at
    ? new Date(authUser.created_at).getTime()
    : 0;
  const isNewSignup = createdAt > 0 && Date.now() - createdAt < 90_000;
  const signupMethod =
    (authUser?.app_metadata?.provider as string | undefined) === "google"
      ? "google"
      : "email";
  // Pass the raw signup timestamp so the client can compute exact
  // "signup → welcome ready" latency for the welcome_form_ready
  // event. Null when the user isn't a fresh signup so we don't
  // pollute the metric with returning-visitor timings.
  const signupTimestamp = isNewSignup ? createdAt : null;

  const workspace = dbUser?.workspaceMembers[0]?.workspace;
  if (workspace) {
    defaultWidgetId = workspace.widgets[0]?.id ?? null;
    workspaceName = workspace.name;
    if (workspace.forms[0]) {
      defaultFormUrl = `/collect/${workspace.slug}/${workspace.forms[0].slug}`;
    }
  }

  return (
    <WelcomeClient
      defaultWidgetId={defaultWidgetId}
      defaultFormUrl={defaultFormUrl}
      workspaceName={workspaceName}
      isNewSignup={isNewSignup}
      signupMethod={signupMethod}
      signupTimestamp={signupTimestamp}
      userId={authUser?.id ?? null}
      userEmail={authUser?.email ?? null}
    />
  );
}
