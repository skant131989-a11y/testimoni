/**
 * Milestone thresholds for the wall-share celebration nudge.
 * Kept in a plain module (not "use client") so both the milestone
 * client component AND server components (/dashboard/page.tsx) can
 * import the same source of truth. Next.js can't export non-component
 * values from "use client" files to server components — importing
 * from here works from either side.
 */
export const MILESTONE_COUNTS: number[] = [1, 5, 10, 25, 50, 100];
