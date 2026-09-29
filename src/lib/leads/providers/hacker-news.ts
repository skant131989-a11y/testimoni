import type { ProviderResult, RawCandidate } from "@/lib/leads/types";

/**
 * Hacker News provider — Algolia's public HN Search API (free, no
 * auth, no rate-limit key needed: https://hn.algolia.com/api). One of
 * the "legitimately accessible" sources the spec asks to start with.
 *
 * Two signals, both matching spec section 2:
 *   1. Recent "Show HN" launches + their top comments — catches
 *      "recently launched product with users" AND "launch comments
 *      containing customer praise" in one pass.
 *   2. Comments matching the spec's keyword list ("how do I collect
 *      testimonials", "wall of love", "customers love", etc.) — this
 *      is retrieval only (cast a wide net); classify.ts does the real
 *      semantic judgment on every hit, so a keyword match here is
 *      just a candidate, not a conclusion.
 *
 * Every fetch has a timeout and is wrapped so a single bad request
 * can't take the whole provider down — see run-scan.ts, which also
 * wraps the whole provider call.
 */

const ALGOLIA_BASE = "https://hn.algolia.com/api/v1";
const FETCH_TIMEOUT_MS = 8_000;

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HN ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

interface AlgoliaHit {
  objectID: string;
  title?: string | null;
  url?: string | null;
  author?: string | null;
  comment_text?: string | null;
  story_text?: string | null;
  created_at?: string | null;
  story_id?: number | null;
  points?: number | null;
}
interface AlgoliaResponse {
  hits: AlgoliaHit[];
}

const KEYWORD_PHRASES = [
  "how do I collect testimonials",
  "testimonial tool",
  "wall of love",
  "collect customer feedback",
  "how to get testimonials",
  "got this message from a customer",
];

async function fetchLaunchesWithComments(limit: number): Promise<RawCandidate[]> {
  const daysAgo = Math.floor(Date.now() / 1000) - 21 * 24 * 60 * 60; // last 3 weeks
  const url = `${ALGOLIA_BASE}/search_by_date?tags=show_hn&numericFilters=created_at_i%3E${daysAgo}&hitsPerPage=${limit}`;
  const { hits } = await fetchJson<AlgoliaResponse>(url);

  const out: RawCandidate[] = [];
  for (const hit of hits) {
    if (!hit.title) continue;
    const itemUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
    // The launch post itself — "recently launched product" signal.
    // A "Show HN: X" post's author is reliably the maker (unlike a
    // random comment's author further down), so this is the one
    // place we hand run-scan a trustworthy founder identity + a real
    // contact link (their HN profile) instead of leaving it to the
    // classifier to guess from free text.
    out.push({
      source: "HACKER_NEWS",
      sourceUrl: itemUrl,
      text: `${hit.title}${hit.story_text ? `\n${hit.story_text}` : ""}`,
      author: hit.author ?? undefined,
      postedAt: hit.created_at ?? undefined,
      knownWebsite: hit.url ?? undefined,
      knownFounderName: hit.author ?? undefined,
      knownFounderSocial: hit.author
        ? `https://news.ycombinator.com/user?id=${hit.author}`
        : undefined,
    });

    // Top comments on the launch — "launch comments containing
    // customer praise" signal. Capped small per launch to keep the
    // total request count bounded.
    try {
      const commentsUrl = `${ALGOLIA_BASE}/search?tags=comment,story_${hit.objectID}&hitsPerPage=8`;
      const { hits: comments } = await fetchJson<AlgoliaResponse>(commentsUrl);
      for (const c of comments) {
        if (!c.comment_text) continue;
        out.push({
          source: "HACKER_NEWS",
          sourceUrl: `https://news.ycombinator.com/item?id=${c.objectID}`,
          text: c.comment_text,
          author: c.author ?? undefined,
          postedAt: c.created_at ?? undefined,
          knownWebsite: hit.url ?? undefined,
          knownProductName: hit.title ?? undefined,
        });
      }
    } catch {
      // One launch's comments failing shouldn't drop the launch
      // candidate itself, already pushed above.
    }
  }
  return out;
}

async function searchKeywordComments(): Promise<RawCandidate[]> {
  const daysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const out: RawCandidate[] = [];
  for (const phrase of KEYWORD_PHRASES) {
    try {
      const url = `${ALGOLIA_BASE}/search?tags=comment&query=${encodeURIComponent(phrase)}&numericFilters=created_at_i%3E${daysAgo}&hitsPerPage=6`;
      const { hits } = await fetchJson<AlgoliaResponse>(url);
      for (const hit of hits) {
        if (!hit.comment_text) continue;
        out.push({
          source: "HACKER_NEWS",
          sourceUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
          text: hit.comment_text,
          author: hit.author ?? undefined,
          postedAt: hit.created_at ?? undefined,
        });
      }
    } catch {
      // Skip this phrase, keep going with the rest.
    }
  }
  return out;
}

export async function fetchHackerNews(opts?: { launchLimit?: number }): Promise<ProviderResult> {
  try {
    const [launches, keywordHits] = await Promise.all([
      fetchLaunchesWithComments(opts?.launchLimit ?? 12),
      searchKeywordComments(),
    ]);
    const seen = new Set<string>();
    const candidates = [...launches, ...keywordHits].filter((c) => {
      if (seen.has(c.sourceUrl)) return false;
      seen.add(c.sourceUrl);
      return true;
    });
    return { source: "HACKER_NEWS", candidates };
  } catch (err) {
    return {
      source: "HACKER_NEWS",
      candidates: [],
      error: err instanceof Error ? err.message : "hacker_news_failed",
    };
  }
}
