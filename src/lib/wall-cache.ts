import { revalidateTag } from "next/cache";

/**
 * Wall of Love cache invalidation.
 *
 * The /w/[widgetId] page caches its DB query under the tag
 * "widget-page" — see src/app/w/[widgetId]/page.tsx. Any mutation
 * that changes what should appear on a wall (approve, archive,
 * edit content/rating, delete, bulk-approve, submission-approve,
 * URL import) calls this helper so the next visitor gets fresh
 * data instead of the up-to-5-minute-stale cached copy.
 *
 * ─── Granularity ─────────────────────────────────────────────
 * We invalidate the shared tag "widget-page", which nukes every
 * workspace's wall cache in one go. At current scale (< 1000
 * workspaces) that's fine — the re-hydration on next visit is
 * one cheap DB query per wall.
 *
 * When we outgrow that, switch this to per-workspace tags like
 * `workspace:${workspaceId}` and have the widget page look up
 * its workspace before it caches. Not worth the plumbing until
 * we can measure the cost.
 */
export function invalidateWallCache(): void {
  // Second arg 'max' is the Next 16 stale-while-revalidate profile —
  // the new signature requires it. Callers still see the same
  // behavior: next request rebuilds the cached response, others
  // keep the previous copy until it lands.
  revalidateTag("widget-page", "max");
}
