import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazy Stripe client — only instantiated at request time. Keeps `next build`
 * from crashing when STRIPE_SECRET_KEY is not yet configured.
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your environment (Vercel → Settings → Environment Variables)."
    );
  }
  cached = new Stripe(key, { typescript: true });
  return cached;
}

/**
 * Back-compat proxy so existing `import { stripe } from ...` calls still work.
 * Each property access resolves through the lazy getter.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as Function).bind(client) : value;
  },
});
