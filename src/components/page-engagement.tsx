"use client";

import { usePageEngagement } from "@/hooks/use-page-engagement";

/**
 * Client-only marker component that mounts the scroll + time
 * engagement tracker. Rendered inside server pages (home, /w/demo)
 * so we don't have to convert whole pages to client components just
 * for analytics.
 */
export function PageEngagement({ surface }: { surface: string }) {
  usePageEngagement({ surface });
  return null;
}
