import type { NormalizedReview, ReviewSourceAdapter } from "./types";

/**
 * Product Hunt adapter.
 *
 * ─── Auth ─────────────────────────────────────────────────────
 * Uses a developer token from https://api.producthunt.com/v2/oauth
 * stored in PRODUCT_HUNT_API_TOKEN. Token is scoped to your PH
 * app and only pulls public data.
 *
 * If the env var isn't set, `available()` returns false and the
 * dashboard UI hides Product Hunt from the source picker so
 * users don't hit a config error.
 *
 * ─── Endpoint ─────────────────────────────────────────────────
 * GraphQL query on the `post` node — returns the product's
 * reviews with rating + body + reviewer info. PH pagination via
 * cursors; we grab the first 100 which covers 99% of products.
 */

const MAX_REVIEWS = 100;
const ENDPOINT = "https://api.producthunt.com/v2/api/graphql";

/**
 * Parse a Product Hunt URL to extract the product slug.
 * Accepts:
 *   https://producthunt.com/products/foo
 *   https://producthunt.com/posts/foo
 *   https://www.producthunt.com/products/foo/reviews
 * Slug is the segment right after /products/ or /posts/.
 */
function parseProductHuntUrl(
  url: string,
): { externalAppId: string; displayName: string } | null {
  try {
    const u = new URL(url);
    if (!/producthunt\.com$/i.test(u.hostname.replace(/^www\./i, ""))) {
      return null;
    }
    const parts = u.pathname.split("/").filter(Boolean);
    const kindIdx = parts.findIndex(
      (p) => p === "products" || p === "posts",
    );
    if (kindIdx === -1 || kindIdx + 1 >= parts.length) return null;
    const slug = parts[kindIdx + 1].toLowerCase();
    const displayName = slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { externalAppId: slug, displayName };
  } catch {
    return null;
  }
}

interface PHReviewEdge {
  node: {
    id: string;
    body: string;
    rating: number;
    createdAt: string;
    user: {
      id: string;
      name: string;
      username: string;
      profileImage?: string | null;
    };
  };
}

interface PHResponse {
  data?: {
    post?: {
      reviews?: { edges: PHReviewEdge[] };
    };
  };
  errors?: Array<{ message: string }>;
}

async function fetchProductHuntReviews(
  slug: string,
): Promise<NormalizedReview[]> {
  const token = process.env.PRODUCT_HUNT_API_TOKEN;
  if (!token) {
    throw new Error("PRODUCT_HUNT_API_TOKEN is not set on the server.");
  }

  const query = `
    query($slug: String!) {
      post(slug: $slug) {
        id
        name
        reviews(first: ${MAX_REVIEWS}, order: NEWEST) {
          edges {
            node {
              id
              body
              rating
              createdAt
              user {
                id
                name
                username
                profileImage
              }
            }
          }
        }
      }
    }`;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables: { slug } }),
  });

  if (!res.ok) {
    throw new Error(`Product Hunt returned ${res.status}`);
  }
  const data = (await res.json()) as PHResponse;
  if (data.errors?.length) {
    throw new Error(data.errors[0].message);
  }
  const edges = data.data?.post?.reviews?.edges ?? [];

  return edges
    .filter((e) => typeof e.node?.body === "string" && e.node.body.trim())
    .map((e) => ({
      externalId: `ph:${e.node.id}`,
      authorName: e.node.user?.name || e.node.user?.username || "PH user",
      authorHandle: e.node.user?.username
        ? `@${e.node.user.username}`
        : null,
      rating: Math.max(1, Math.min(5, Math.round(e.node.rating))),
      content: e.node.body.trim(),
      sourceUrl: `https://www.producthunt.com/products/${slug}/reviews`,
      postedAt: new Date(e.node.createdAt),
    }));
}

export const productHuntAdapter: ReviewSourceAdapter = {
  platform: "PRODUCT_HUNT",
  parseUrl: parseProductHuntUrl,
  fetchReviews: fetchProductHuntReviews,
  available: () => !!process.env.PRODUCT_HUNT_API_TOKEN,
};
