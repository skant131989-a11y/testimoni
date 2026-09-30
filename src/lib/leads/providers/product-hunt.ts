import type { ProviderResult, RawCandidate } from "@/lib/leads/types";

/**
 * Product Hunt provider — the official v2 GraphQL API, same
 * PRODUCT_HUNT_API_TOKEN already used by the testimonial importer
 * (src/app/api/testimonials/import-url/route.ts). Authorized/official
 * per the spec's "optional when permitted/configured" list.
 *
 * Two queries, merged:
 *   NEWEST — catches "recently launched" + founders asking about
 *            testimonials on their own fresh launch thread.
 *   VOTES (last 45 days) — catches products with real traction.
 *            Confirmed live: a top-voted post routinely has 100-200+
 *            comments vs. near-zero on a brand-new launch, so this is
 *            a much denser source of genuine customer praise — the
 *            core "already has testimonials worth surfacing" signal.
 * No token configured → returns an empty result with an error
 * string, never throws; the scan just runs without this source.
 */

const PH_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";
const FETCH_TIMEOUT_MS = 10_000;
const REDIRECT_TIMEOUT_MS = 6_000;
const RESOLVE_CONCURRENCY = 5;
const VOTES_WINDOW_DAYS = 45;

/**
 * Product Hunt's GraphQL `website` field returns their own click-
 * tracking redirect (producthunt.com/r/XXXX?utm_campaign=...), not
 * the company's actual domain — confirmed by following one manually.
 * Left unresolved, every PH-sourced candidate's "website" normalizes
 * to producthunt.com, which normalize.ts's REJECT_HOSTS correctly
 * throws out (we don't want the platform itself as a fake lead) —
 * silently discarding every real lead PH found in the process. One
 * redirect hop resolves it to the real destination.
 */
async function resolveRealWebsite(url: string | null | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  if (!/^https?:\/\/(www\.)?producthunt\.com\/r\//i.test(url)) return url;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REDIRECT_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    return res.url || undefined;
  } catch {
    return undefined; // resolution failed — better to drop the website than keep the PH redirect
  } finally {
    clearTimeout(t);
  }
}

interface PHCommentNode {
  body?: string | null;
  user?: { name?: string | null; username?: string | null } | null;
}
interface PHMaker {
  name?: string | null;
  username?: string | null;
  twitterUsername?: string | null;
}
interface PHPostNode {
  id: string;
  name?: string | null;
  tagline?: string | null;
  website?: string | null;
  url?: string | null;
  createdAt?: string | null;
  makers?: PHMaker[] | null;
  comments?: { edges?: { node?: PHCommentNode }[] } | null;
}
interface PHResponse {
  data?: {
    posts?: { edges?: { node?: PHPostNode }[] };
  };
  errors?: { message?: string }[];
}

export function hasProductHunt(): boolean {
  return !!process.env.PRODUCT_HUNT_API_TOKEN;
}

async function fetchPosts(
  token: string,
  order: "NEWEST" | "VOTES",
  first: number,
  postedAfter?: string
): Promise<{ posts: PHPostNode[]; error?: string }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(PH_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `query($first: Int!, $after: DateTime) {
          posts(order: ${order}, first: $first, postedAfter: $after) {
            edges {
              node {
                id
                name
                tagline
                website
                url
                createdAt
                makers { name username twitterUsername }
                comments(first: 8) {
                  edges { node { body user { name username } } }
                }
              }
            }
          }
        }`,
        variables: { first, after: postedAfter },
      }),
    });
    if (!res.ok) return { posts: [], error: `http_${res.status}` };
    const json = (await res.json()) as PHResponse;
    if (json.errors?.length) return { posts: [], error: json.errors[0]?.message ?? "graphql_error" };
    return { posts: json.data?.posts?.edges?.map((e) => e.node).filter((n): n is PHPostNode => !!n) ?? [] };
  } catch (err) {
    return { posts: [], error: err instanceof Error ? err.message : "product_hunt_failed" };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchProductHuntLeads(opts?: { limit?: number }): Promise<ProviderResult> {
  const token = process.env.PRODUCT_HUNT_API_TOKEN;
  if (!token) {
    return { source: "PRODUCT_HUNT", candidates: [], error: "not_configured" };
  }

  const limit = opts?.limit ?? 15;
  const votesAfter = new Date(Date.now() - VOTES_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [newest, popular] = await Promise.all([
    fetchPosts(token, "NEWEST", limit),
    fetchPosts(token, "VOTES", Math.max(10, Math.round(limit / 2)), votesAfter),
  ]);
  const errors = [newest.error, popular.error].filter(Boolean) as string[];
  if (errors.length === 2) {
    // Both queries failed — nothing to work with.
    return { source: "PRODUCT_HUNT", candidates: [], error: errors.join("; ") };
  }

  const seen = new Set<string>();
  const posts = [...newest.posts, ...popular.posts].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  try {
    // Resolve every post's real website up front (bounded concurrency)
    // so both the post candidate and its comment candidates use the
    // real domain, not the PH redirect.
    const resolvedWebsites = new Map<string, string | undefined>();
    for (let i = 0; i < posts.length; i += RESOLVE_CONCURRENCY) {
      const chunk = posts.slice(i, i + RESOLVE_CONCURRENCY);
      const resolved = await Promise.all(chunk.map((p) => resolveRealWebsite(p.website)));
      chunk.forEach((p, idx) => resolvedWebsites.set(p.id, resolved[idx]));
    }

    const candidates: RawCandidate[] = [];
    for (const post of posts) {
      if (!post.name) continue;
      const postUrl = post.url || `https://www.producthunt.com/posts/${post.id}`;
      const website = resolvedWebsites.get(post.id);
      // Real maker identity from Product Hunt itself, not a guess —
      // same reasoning as the HN launch author (see hacker-news.ts).
      // Prefer a maker who has a Twitter handle set (most directly
      // actionable contact), falling back to any maker with a name.
      const maker =
        post.makers?.find((m) => m.twitterUsername) ??
        post.makers?.find((m) => m.username || m.name) ??
        null;
      // The launch itself.
      candidates.push({
        source: "PRODUCT_HUNT",
        sourceUrl: postUrl,
        text: `${post.name}${post.tagline ? ` — ${post.tagline}` : ""}`,
        postedAt: post.createdAt ?? undefined,
        knownWebsite: website,
        knownProductName: post.name,
        knownFounderName: maker?.name ?? maker?.username ?? undefined,
        // A real X/Twitter handle is far more actionable than a PH
        // profile link (which itself often just re-links to Twitter),
        // so prefer it when the maker has one set.
        knownFounderSocial: maker?.twitterUsername
          ? `https://x.com/${maker.twitterUsername}`
          : maker?.username
            ? `https://www.producthunt.com/@${maker.username}`
            : undefined,
      });
      // Its public comments — where launch-day (or, for popular
      // posts, ongoing) praise lives.
      const comments = post.comments?.edges?.map((e) => e.node).filter((n): n is PHCommentNode => !!n) ?? [];
      for (const c of comments) {
        if (!c.body) continue;
        candidates.push({
          source: "PRODUCT_HUNT",
          sourceUrl: postUrl,
          text: c.body,
          author: c.user?.name || c.user?.username || undefined,
          postedAt: post.createdAt ?? undefined,
          knownWebsite: website,
          knownProductName: post.name,
        });
      }
    }
    return { source: "PRODUCT_HUNT", candidates, error: errors[0] };
  } catch (err) {
    return {
      source: "PRODUCT_HUNT",
      candidates: [],
      error: err instanceof Error ? err.message : "product_hunt_failed",
    };
  }
}
