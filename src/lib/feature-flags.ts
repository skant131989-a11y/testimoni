/**
 * Feature flag for the Pro AI ($29/mo) tier's public visibility.
 *
 * TRUE  → Pro AI card renders on /pricing and home. Requires the
 *         Razorpay Pro AI plan + Stripe Pro AI price to exist and
 *         their env vars set (RAZORPAY_PRO_AI_PLAN_ID / _USD / _INR,
 *         STRIPE_PRO_AI_PRICE_ID) so the checkout doesn't 404.
 * FALSE → Only Free and Pro cards render publicly. The Pro AI
 *         tier still exists in the schema (PRO_AI enum), plan
 *         limits (PLAN_LIMITS.PRO_AI), and pricing hook — the
 *         only thing gated is the marketing surface.
 *
 * Flip this to true AFTER:
 *   1. Create the Pro AI product in Razorpay ($29 / ₹1499)
 *   2. Create the Pro AI product in Stripe (for USD)
 *   3. Add env vars: RAZORPAY_PRO_AI_PLAN_ID, RAZORPAY_PRO_AI_PLAN_ID_USD,
 *      RAZORPAY_PRO_AI_PLAN_ID_INR, STRIPE_PRO_AI_PRICE_ID
 *   4. Verify checkout works end-to-end
 */
export const PRO_AI_PUBLIC = false;

/**
 * Feature flag for OAuth-based auto-post to X and LinkedIn.
 *
 * TRUE  → Tweet-drafts page shows "Connect X" / "Connect LinkedIn"
 *         chips and "Post to X" / "Post to LinkedIn" one-click
 *         auto-post buttons. Requires TWITTER_CLIENT_ID/SECRET,
 *         LINKEDIN_CLIENT_ID/SECRET, and OAUTH_STATE_SECRET env
 *         vars. Also requires an X app with write scope and a
 *         LinkedIn app with w_member_social scope — both take
 *         real setup work.
 * FALSE → Only the "Open in X" / "Open in LinkedIn" web-intent
 *         buttons render. These open a pre-filled compose window
 *         in a new tab; user clicks Post themselves. Zero env
 *         vars, zero OAuth setup, works today. 2 seconds of
 *         friction vs. true auto-post — acceptable at MVP scale.
 *
 * The OAuth API routes + models sit dormant when this is false —
 * flip to true once the OAuth apps exist and env vars are set.
 */
export const SOCIAL_AUTO_POST_ENABLED = false;
