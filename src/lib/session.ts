import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User as PrismaUser } from "@prisma/client";

/**
 * Per-request cached session helpers.
 *
 * React's `cache()` wraps a function so the SAME server-rendering
 * pass shares one result. In App Router, one HTTP request renders
 * the layout AND the page — before this file, both surfaces
 * independently ran `supabase.auth.getUser()` + `prisma.user.
 * findUnique()`. That's 4 network round-trips (2 to Supabase Auth,
 * 2 to Postgres) just to answer "who is this user?" on every
 * dashboard nav.
 *
 * With cache(): the layout's call executes and stores the result;
 * the page's call hits the memo and returns the same object. 4
 * round-trips → 2. Saves ~200-400ms per navigation on dashboard,
 * welcome, and every other route inside /dashboard/*.
 *
 * ─── Cache scope ────────────────────────────────────────────────
 * Per-REQUEST only. React re-creates the cache for every server
 * render, so different users can never see each other's session
 * data. This is safe in a way a global module-level cache would
 * not be.
 */

/**
 * Supabase auth user — the JWT payload from the request cookie.
 * Null when the visitor isn't signed in. Cached per request.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Prisma User row + first workspace membership (owner path) +
 * the workspace's subscription and default widget, in ONE query.
 *
 * This is the exact shape both dashboard/layout.tsx and every
 * /dashboard/* page consume, so caching it once here means
 * every consumer gets it free after the first hit.
 *
 * Returns null when either the auth user is missing or their
 * Prisma row hasn't been provisioned yet. Callers should
 * handle both cases the same (redirect / provision).
 */
export const getDbUserWithWorkspace = cache(async () => {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  return prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              subscription: true,
              // Default (oldest active) widget — shared shape
              // used by the sidebar wall URL, dashboard NBA,
              // welcome-page embed snippet.
              widgets: {
                where: { isActive: true },
                orderBy: { createdAt: "asc" },
                take: 1,
                select: { id: true },
              },
              // Default (oldest) collection form — shared shape
              // used by welcome page + dashboard FormUrlCard.
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
});

/**
 * Non-cached variant. Use as a fallback in child pages when the
 * cached `getDbUserWithWorkspace()` returns null.
 *
 * Why: React.cache memoizes per-render. If the layout ran the
 * cached function BEFORE provisioning a first-time user, it saw
 * null; that null gets memoized for the whole render. Even after
 * the layout's provisioning $transaction succeeds, child pages
 * that call the cached fn get the stale null.
 *
 * Pattern in child pages:
 *   const dbUser = (await getDbUserWithWorkspace())
 *     ?? (await loadDbUserWithWorkspaceFresh());
 *   if (!dbUser) redirect("/login");
 *
 * Zero cost on the returning-user path (cache hit). One extra
 * ~40ms query on the first-visit path — acceptable given
 * provisioning already ran a 6-row $transaction.
 */
export async function loadDbUserWithWorkspaceFresh() {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  return prisma.user.findUnique({
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
}

/** Convenience type for pages that consume the cached user. */
export type DbUserWithWorkspace = NonNullable<
  Awaited<ReturnType<typeof getDbUserWithWorkspace>>
> & { dummy?: PrismaUser };
