import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed "open my dashboard" links for the reminder emails sent to people who
 * asked for an account but never entered their code.
 *
 * A token names exactly one auth user and expires after 7 days. Opening the
 * link only shows a page with one button (so mail scanners that open every link
 * cannot sign anyone in); the button calls the API with the token, which is
 * checked here and again against the account (it only works while that account
 * has never signed in).
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string | null {
  return process.env.REVIEW_LINK_SECRET || process.env.CRON_SECRET || null;
}

function sig(payload: string, key: string): string {
  return createHmac("sha256", `signup-link:${key}`).update(payload).digest("base64url");
}

export function signSignupToken(authUserId: string, now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(`${authUserId}.${now + TTL_MS}`).toString("base64url");
  return `${payload}.${sig(payload, key)}`;
}

export function verifySignupToken(token: string, now = Date.now()): { authUserId: string } | null {
  const key = secret();
  if (!key || typeof token !== "string") return null;
  const [payload, given] = token.split(".");
  if (!payload || !given) return null;
  const expected = sig(payload, key);
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [id, exp] = Buffer.from(payload, "base64url").toString().split(".");
  if (!id || !exp || Number(exp) < now) return null;
  return { authUserId: id };
}
