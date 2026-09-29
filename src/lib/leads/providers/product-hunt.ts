import type { ProviderResult, RawCandidate } from "@/lib/leads/types";

/**
 * Product Hunt provider — the official v2 GraphQL API, same
 * PRODUCT_HUNT_API_TOKEN already used by the testimonial importer
 * (src/app/api/testimonials/import-url/route.ts). Authorized/official
 * per the spec's "optional when permitted/configured" list.
 *
 * Pulls recently-launched products + their public comments — directly
 * matches spec section 2's "recently launched product with users" and
 * "launch comments containing customer praise". No token configured
 * → returns an empty result with an error string, never throws; the
 * scan just runs without this source.
 */

const PH_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";
const FETCH_TIMEOUT_MS = 10_000;
const REDIRECT_TIMEOUT_MS = 6_000;
const RESOLVE_CONCURRENCY = 5;

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

export async function fetchProductHuntLeads(opts?: { limit?: number }): Promise<ProviderResult> {
  const token = process.env.PRODUCT_HUNT_API_TOKEN;
  if (!token) {
    return { source: "PRODUCT_HUNT", candidates: [], error: "not_configured" };
  }

  const limit = opts?.limit ?? 15;
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
        query: `query($first: Int!) {
          posts(order: NEWEST, first: $first) {
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
        variables: { first: limit },
      }),
    });
    if (!res.ok) {
      return { source: "PRODUCT_HUNT", candidates: [], error: `http_${res.status}` };
    }
    const json = (await res.json()) as PHResponse;
    if (json.errors?.length) {
      return { source: "PRODUCT_HUNT", candidates: [], error: json.errors[0]?.message ?? "graphql_error" };
    }

    const posts = json.data?.posts?.edges?.map((e) => e.node).filter((n): n is PHPostNode => !!n) ?? [];

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
      // Its public comments — where launch-day praise lives.
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
    return { source: "PRODUCT_HUNT", candidates };
  } catch (err) {
    return {
      source: "PRODUCT_HUNT",
      candidates: [],
      error: err instanceof Error ? err.message : "product_hunt_failed",
    };
  } finally {
    clearTimeout(t);
  }
}
