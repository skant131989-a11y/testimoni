"use client";

import { usePathname } from "next/navigation";
import { useIsLoggedIn } from "@/lib/use-is-logged-in";
import { MentionsBanner } from "@/components/dashboard/mentions-banner";

// Pages where a banner would be wrong: the dashboard has its own, auth
// screens are mid-flow, and Wall of Love / collection / embed pages are
// customer-facing surfaces of OTHER people's products.
const EXCLUDED_PREFIXES = [
  "/dashboard",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/admin",
  "/w/",
  "/collect/",
  "/embed",
];

/**
 * Same prompt/banner as the dashboard, for a signed-in user browsing
 * the public site (home, pricing, tools…). Anonymous visitors never
 * trigger the API call.
 */
export function PublicMentionsBanner() {
  const pathname = usePathname() ?? "";
  const loggedIn = useIsLoggedIn();
  if (!loggedIn) return null;
  if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`))) {
    return null;
  }
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-3">
      <MentionsBanner />
    </div>
  );
}
