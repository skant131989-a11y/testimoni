"use client";

import { usePageEngagement } from "@/hooks/use-page-engagement";

/**
 * Client-only marker component that mounts the scroll + time
 * engagement tracker. Rendered inside server pages (home, /w/demo)
 * so we don't have to convert whole pages to client components just
 * for analytics.
 *
 * Set `anonymous` for PUBLIC pages (Wall of Love, sample pages,
 * collect forms) so the events don't inherit the current logged-in
 * user's identity when the workspace owner tests their own public
 * URL.
 */
export function PageEngagement({
  surface,
  anonymous = false,
}: {
  surface: string;
  anonymous?: boolean;
}) {
  usePageEngagement({ surface, anonymous });
  return null;
}
