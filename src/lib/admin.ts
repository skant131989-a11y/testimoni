import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";

/**
 * Internal admin allowlist — used by /admin/** pages and their API
 * routes. Deliberately hardcoded, not a DB flag: this is a two-person
 * internal tool, and a hardcoded list is easier to audit than a role
 * column someone could accidentally grant.
 */
const ADMIN_EMAILS = new Set([
  "neha.singh.founder@gmail.com",
  "s.kant131989@gmail.com",
]);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

/**
 * Server-component guard for /admin pages. Reuses the SAME login flow
 * as the rest of the app (Supabase session via getAuthUser) — an
 * admin signs in at the normal /login page, then this just checks
 * their email is on the allowlist. Not signed in → /login with a
 * `next` back to the admin page. Signed in but not an admin → sent to
 * the regular dashboard, not shown a 403 (avoids confirming to a
 * curious logged-in user that /admin/leads exists).
 */
export async function requireAdmin(nextPath: string): Promise<{ email: string }> {
  const authUser = await getAuthUser();
  if (!authUser?.email) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!isAdminEmail(authUser.email)) {
    redirect("/dashboard");
  }
  return { email: authUser.email };
}

/**
 * API-route guard — same allowlist, same "don't confirm this exists"
 * posture: unauthenticated and non-admin both get a plain 404, not a
 * 401/403 that reveals the route is real.
 */
export async function requireAdminApi(): Promise<{ email: string } | null> {
  const authUser = await getAuthUser();
  if (!authUser?.email || !isAdminEmail(authUser.email)) return null;
  return { email: authUser.email };
}
