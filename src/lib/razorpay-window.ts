/**
 * Shared type declarations for the Razorpay Checkout SDK.
 *
 * The billing page (/dashboard/settings/billing) and the reusable
 * <UpgradeProButton> both open the same Razorpay modal. Declaring
 * the SDK shape in one place keeps `window.Razorpay` and the
 * options interface consistent across surfaces — otherwise TS
 * flags duplicate global augmentations as type mismatches.
 */

export interface RazorpayCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
  /** Fires when Razorpay reports payment success. Response payload
   *  varies by flow — subscription checkouts return
   *  { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
   *  but the object is opaque here; consumers rely on the server-side
   *  /verify endpoint instead of parsing the response client-side. */
  handler?: (response: {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

/**
 * One-time Order checkout (e.g. the $9 scan-report unlock) — same
 * modal, different options shape: `order_id` + explicit
 * `amount`/`currency` instead of `subscription_id`. Kept as a
 * separate interface so the subscription-checkout callers above are
 * untouched.
 */
export interface RazorpayOrderCheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
  handler?: (response: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (
      opts: RazorpayCheckoutOptions | RazorpayOrderCheckoutOptions
    ) => { open: () => void };
  }
}
