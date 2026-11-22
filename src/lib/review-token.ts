import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed one-tap review links for the "new testimonial" and reminder emails.
 *
 * A token names exactly one submission and expires after 14 days. Opening the
 * link only shows a page with Approve and Reject buttons (so mail scanners
 * that open every link cannot approve anything); the buttons call the API
 * with the token, which is checked here. The token proves the link came from
 * us; it carries no other access.
 */
const TTL_MS = 14 * 24 * 60 * 60 * 1000;

function secret(): string | null {
  return process.env.REVIEW_LINK_SECRET || process.env.CRON_SECRET || null;
}

function sig(payload: string, key: string): string {
  return createHmac("sha256", `review-link:${key}`).update(payload).digest("base64url");
}

export function signReviewToken(submissionId: string, now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(`${submissionId}.${now + TTL_MS}`).toString("base64url");
  return `${payload}.${sig(payload, key)}`;
}

export function verifyReviewToken(token: string, now = Date.now()): { submissionId: string } | null {
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
  return { submissionId: id };
}
