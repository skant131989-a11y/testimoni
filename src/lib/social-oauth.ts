/**
 * OAuth 2.0 helpers for X (Twitter) and LinkedIn.
 *
 * Both providers use OAuth 2.0 with PKCE (X requires it; LinkedIn
 * supports it and we use it for consistency).
 *
 * ─── Configuration ──────────────────────────────────────────────
 * Set these env vars to enable each provider:
 *   TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET
 *   LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
 *   NEXT_PUBLIC_APP_URL — used to construct the callback URL
 *
 * If env vars are absent, isProviderConfigured() returns false
 * and the UI shows a "Setup required" state instead of the
 * connect button. This lets us ship the feature without blocking
 * on Neha creating the OAuth apps.
 */

import crypto from "node:crypto";

export type SocialProvider = "TWITTER" | "LINKEDIN";

type ProviderConfig = {
  clientId: string | undefined;
  clientSecret: string | undefined;
  authUrl: string;
  tokenUrl: string;
  scope: string;
  meUrl: string;
};

const CONFIG: Record<SocialProvider, ProviderConfig> = {
  TWITTER: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scope: "tweet.read tweet.write users.read offline.access",
    meUrl: "https://api.twitter.com/2/users/me",
  },
  LINKEDIN: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    // "w_member_social" = post as user; "openid profile" = identify.
    scope: "openid profile w_member_social",
    meUrl: "https://api.linkedin.com/v2/userinfo",
  },
};

export function isProviderConfigured(provider: SocialProvider): boolean {
  const c = CONFIG[provider];
  return Boolean(c.clientId && c.clientSecret);
}

export function callbackUrl(provider: SocialProvider): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/oauth/${provider.toLowerCase()}/callback`;
}

/**
 * Generate a PKCE code_verifier / code_challenge pair. RFC 7636.
 * The verifier is a 64-byte random URL-safe string; the challenge
 * is its SHA-256 base64url-encoded.
 */
export function generatePkce() {
  const verifier = crypto.randomBytes(64).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

/**
 * Build the provider's authorization URL. The `state` parameter is
 * signed so we can verify the callback belongs to the request that
 * originated it. We stuff the workspaceId + PKCE verifier into an
 * HMAC-signed payload; we don't persist a nonce table for MVP.
 */
export function buildAuthUrl(
  provider: SocialProvider,
  state: string,
  challenge: string
): string {
  const c = CONFIG[provider];
  const params = new URLSearchParams({
    response_type: "code",
    client_id: c.clientId!,
    redirect_uri: callbackUrl(provider),
    scope: c.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${c.authUrl}?${params}`;
}

export async function exchangeCodeForToken(
  provider: SocialProvider,
  code: string,
  verifier: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const c = CONFIG[provider];
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: callbackUrl(provider),
    code_verifier: verifier,
    client_id: c.clientId!,
  });

  // X requires HTTP Basic auth for confidential clients even with PKCE.
  // LinkedIn accepts either — we use Basic for both.
  const basic = Buffer.from(`${c.clientId}:${c.clientSecret}`).toString("base64");

  const res = await fetch(c.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function fetchMe(
  provider: SocialProvider,
  accessToken: string
): Promise<{ externalId: string; handle: string }> {
  const c = CONFIG[provider];
  const res = await fetch(c.meUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Fetching /me failed: ${res.status}`);
  }
  const data = await res.json();
  if (provider === "TWITTER") {
    return {
      externalId: data.data?.id,
      handle: `@${data.data?.username}` || "unknown",
    };
  }
  // LinkedIn OIDC userinfo
  return {
    externalId: data.sub,
    handle: data.name || data.email || "LinkedIn",
  };
}

/**
 * State signing — signs (workspaceId + provider + verifier) with
 * an HMAC so the callback can verify it. Uses OAUTH_STATE_SECRET
 * (or NEXTAUTH_SECRET as a fallback) — never fall back to a
 * hardcoded string.
 */
export function signState(payload: object): string {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("OAUTH_STATE_SECRET not set");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyState<T = unknown>(state: string): T | null {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const [body, mac] = state.split(".");
  if (!body || !mac) return null;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  if (mac !== expected) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
}

/**
 * Post text to the provider using the workspace's stored token.
 * Returns the provider's post URL on success.
 */
export async function postToProvider(
  provider: SocialProvider,
  accessToken: string,
  text: string,
  externalUserId?: string
): Promise<{ postUrl: string; postId: string }> {
  if (provider === "TWITTER") {
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      throw new Error(`X post failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const id = data.data.id;
    return { postId: id, postUrl: `https://twitter.com/i/status/${id}` };
  }

  // LinkedIn: /rest/posts with an "author" URN
  const author = `urn:li:person:${externalUserId}`;
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (!res.ok) {
    throw new Error(`LinkedIn post failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const id = data.id;
  return {
    postId: id,
    // LinkedIn URNs → activity URL; best-effort — the URN can be
    // converted directly.
    postUrl: `https://www.linkedin.com/feed/update/${id}/`,
  };
}
