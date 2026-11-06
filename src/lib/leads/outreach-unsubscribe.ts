import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60;

function secret() {
  return process.env.OUTREACH_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || "";
}

export function canCreateOutreachUnsubscribeToken() {
  return Boolean(secret());
}

export function createOutreachUnsubscribeToken(email: string, now = Math.floor(Date.now() / 1000)) {
  const key = secret();
  if (!key) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const expires = now + TOKEN_TTL_SECONDS;
  const signature = createHmac("sha256", key).update(`${normalizedEmail}\n${expires}`).digest("base64url");
  return `${expires}.${signature}`;
}

export function outreachUnsubscribeUrl(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const token = createOutreachUnsubscribeToken(normalizedEmail);
  if (!token) return `mailto:hello@testimoni.io?subject=Unsubscribe`;
  return `https://testimoni.io/api/outreach/unsubscribe?email=${encodeURIComponent(normalizedEmail)}&token=${encodeURIComponent(token)}`;
}

export function verifyOutreachUnsubscribeToken(email: string, token: string, now = Math.floor(Date.now() / 1000)) {
  const key = secret();
  const [expiresText, signature, extra] = token.split(".");
  const expires = Number(expiresText);
  if (!key || extra || !Number.isSafeInteger(expires) || expires < now || !signature) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const expected = createHmac("sha256", key).update(`${normalizedEmail}\n${expires}`).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "base64url"); } catch { return false; }
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
