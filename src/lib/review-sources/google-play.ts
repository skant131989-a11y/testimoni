import type { NormalizedReview, ReviewSourceAdapter } from "./types";

/**
 * Google Play Store adapter.
 *
 * ─── Auth ─────────────────────────────────────────────────────
 * Requires a Google Cloud service account with the "androidpublisher"
 * scope + the account added as an admin on the Play Console for
 * your app. The JSON key file's contents are stored as
 * GOOGLE_PLAY_SERVICE_ACCOUNT_KEY (single-line JSON).
 *
 * We DON'T pull in the googleapis npm package here — it's ~40MB
 * and we only need 2 endpoints. Instead we sign our own JWT and
 * hit the REST endpoint directly. Tradeoff: a bit more code, ~200
 * fewer megabytes in the bundle.
 *
 * ─── Endpoint ─────────────────────────────────────────────────
 * androidpublisher.reviews.list — returns most-recent 100 reviews
 * per call, but Google ONLY exposes reviews from the last 7 days.
 * Historical backfill requires the user to export from Play Console
 * and CSV-upload — noted in the UI.
 *
 * ─── Not-configured state ─────────────────────────────────────
 * If the env key is missing, available() returns false and the
 * UI hides Play Store from the source picker so users don't hit
 * a config error. When the key lands, the option appears.
 */

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface RawReview {
  reviewId: string;
  authorName?: string;
  comments?: Array<{
    userComment?: {
      text?: string;
      starRating?: number;
      lastModified?: { seconds?: string };
    };
  }>;
}

interface PlayReviewsResponse {
  reviews?: RawReview[];
}

/**
 * Parse a Play Store URL to extract the package name.
 * Accepts:
 *   https://play.google.com/store/apps/details?id=com.example
 *   https://play.google.com/store/apps/details?id=com.example&hl=en
 */
function parsePlayStoreUrl(
  url: string,
): { externalAppId: string; displayName: string } | null {
  try {
    const u = new URL(url);
    if (!/^play\.google\.com$/i.test(u.hostname)) return null;
    if (!u.pathname.includes("/store/apps/details")) return null;
    const packageName = u.searchParams.get("id");
    if (!packageName) return null;
    // Display name = the last path-like segment of the package, cased.
    const last = packageName.split(".").pop() ?? packageName;
    const displayName = last
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { externalAppId: packageName, displayName };
  } catch {
    return null;
  }
}

function getServiceAccount(): ServiceAccountKey | null {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccountKey;
  } catch {
    return null;
  }
}

/**
 * Get an OAuth access token for the Reviews API using the JWT
 * bearer flow. Google caches these for 1 hour but we don't cache
 * across serverless invocations — Vercel functions are stateless.
 */
async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: sa.token_uri,
    iat: nowSec,
    exp: nowSec + 3600,
  };

  // Sign RS256 using Node's crypto — Web Crypto's PKCS8 import is
  // finicky with Google's key format so native crypto is more
  // reliable here.
  const { createSign } = await import("node:crypto");
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = signer
    .sign(sa.private_key.replace(/\\n/g, "\n"))
    .toString("base64url");
  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Google OAuth returned ${res.status}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google OAuth response missing access_token");
  }
  return data.access_token;
}

async function fetchPlayStoreReviews(
  packageName: string,
): Promise<NormalizedReview[]> {
  const sa = getServiceAccount();
  if (!sa) {
    throw new Error(
      "GOOGLE_PLAY_SERVICE_ACCOUNT_KEY is not configured on the server.",
    );
  }
  const token = await getAccessToken(sa);
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/reviews?maxResults=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Play Store Reviews API returned ${res.status}: ${errText.slice(0, 200)}`,
    );
  }
  const data = (await res.json()) as PlayReviewsResponse;
  const rows = data.reviews ?? [];

  return rows
    .map((r): NormalizedReview | null => {
      const comment = r.comments?.[0]?.userComment;
      if (!comment) return null;
      const text = comment.text?.trim();
      if (!text) return null;
      const rating = comment.starRating;
      if (typeof rating !== "number" || rating < 1 || rating > 5) return null;
      const postedSec = comment.lastModified?.seconds;
      const postedAt = postedSec
        ? new Date(parseInt(postedSec, 10) * 1000)
        : new Date();
      return {
        externalId: `gp:${r.reviewId}`,
        authorName: r.authorName || "Play Store user",
        authorHandle: null,
        rating,
        content: text,
        sourceUrl: `https://play.google.com/store/apps/details?id=${packageName}`,
        postedAt,
      };
    })
    .filter((r): r is NormalizedReview => r !== null);
}

export const googlePlayAdapter: ReviewSourceAdapter = {
  platform: "GOOGLE_PLAY",
  parseUrl: parsePlayStoreUrl,
  fetchReviews: fetchPlayStoreReviews,
  available: () => !!process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY,
};
