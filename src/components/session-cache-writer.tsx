"use client";

import { useEffect } from "react";
import { writeSessionCache, type SessionCachePayload } from "@/lib/session-cache";

/**
 * Client-only component that persists the current server-render's
 * fresh workspace + URL data to localStorage. Drop into a
 * server-rendered layout with the values the layout already
 * computed; on mount, we sync to localStorage.
 *
 * Rendered by dashboard/layout.tsx so ANY /dashboard/* route
 * keeps the cache warm. Reading happens elsewhere — welcome-client,
 * FormUrlCard, sidebar — via readSessionCache() on mount to
 * eliminate the "loading placeholder → real value" flicker on
 * subsequent visits.
 */
export function SessionCacheWriter(props: SessionCachePayload) {
  useEffect(() => {
    writeSessionCache(props);
    // JSON.stringify(props) as dep so we only re-write when a
    // value actually changed (matches the writer's internal
    // no-op guard, but cheaper than doing a diff at write time).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.workspaceId,
    props.workspaceSlug,
    props.workspaceName,
    props.plan,
    props.formUrl,
    props.wallUrl,
    props.embedOrigin,
    props.supabaseUserId,
  ]);

  return null;
}
