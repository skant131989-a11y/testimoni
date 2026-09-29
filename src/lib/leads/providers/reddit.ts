import type { ProviderResult } from "@/lib/leads/types";

/**
 * Reddit provider — spec lists this as "optional when
 * permitted/configured." Reddit's official API needs an OAuth app
 * (REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET / a registered user agent)
 * that this project doesn't have configured yet, and unauthenticated
 * scraping of Reddit is against their terms — the spec explicitly
 * says not to bypass platform restrictions. So this provider is a
 * documented no-op until those creds exist, never a silent scraper.
 *
 * To enable: register an app at reddit.com/prefs/apps (type
 * "script"), set REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET, and swap this
 * body for a client-credentials OAuth fetch against oauth.reddit.com
 * (e.g. /r/SaaS/search, /r/startups/search with keyword queries
 * mirroring hacker-news.ts's KEYWORD_PHRASES). Same RawCandidate
 * shape as the other providers, so run-scan.ts needs no changes.
 */
export function hasReddit(): boolean {
  return !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);
}

export async function fetchReddit(): Promise<ProviderResult> {
  if (!hasReddit()) {
    return { source: "REDDIT", candidates: [], error: "not_configured" };
  }
  // Not implemented — see the file header. Configuring the env vars
  // alone won't enable this provider; the fetch itself still needs
  // to be written.
  return { source: "REDDIT", candidates: [], error: "not_implemented" };
}
