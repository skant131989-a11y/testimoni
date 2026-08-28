import Razorpay from "razorpay";
import crypto from "crypto";

let cached: Razorpay | null = null;

/**
 * Lazy Razorpay client — instantiated at request time, not at build.
 */
export function getRazorpay(): Razorpay {
  if (cached) return cached;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment"
    );
  }
  cached = new Razorpay({ key_id, key_secret });
  return cached;
}

/**
 * Verify a webhook payload signature using HMAC-SHA256.
 * Razorpay POSTs the raw body + a hex-encoded HMAC in `x-razorpay-signature`.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
