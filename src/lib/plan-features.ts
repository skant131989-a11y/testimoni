/**
 * Single source of truth for what's in each pricing tier. Both the
 * home page's pricing preview and the full /pricing page import from
 * this file, so a copy change on one lands on the other for free.
 *
 * ─── Pricing model (2026-09) ─────────────────────────────────────
 *   Free              — try before you buy; viral loops live here
 *   Pro   ($9/mo)     — utility unlocks + one AI perk (unlimited
 *                        Testimonial → Tweet drafts) so users get
 *                        something AI-flavored for their $9
 *   Pro AI ($29/mo)   — the intelligence layer (Ask My Wall,
 *                        Wall Score tracking, weekly insights).
 *                        Where the real "does AI convert?" signal
 *                        lives.
 *
 * ─── Rules ───────────────────────────────────────────────────────
 *   - Same lists on home and /pricing (parity across surfaces).
 *   - Each tier list is intentionally longer than the previous so
 *     the value ladder reads at a glance.
 *   - Keep phrasing consistent — don't hand-edit one page's copy
 *     without updating this file.
 */

export const FREE_FEATURES = [
  "10 testimonials",
  "3 free screenshot extractions (AI)",
  "1 Wall Score audit (with shareable score card)",
  "5 Testimonial → Tweet drafts / month",
  "URL import — X, LinkedIn, Reddit, HN, Product Hunt",
  "1 collection form + 1 widget",
  "1 video testimonial (MP4/MOV, up to 50MB)",
  "Public Wall of Love URL",
  "Grid layout + one-line script embed",
  "Email support",
] as const;

export const PRO_FEATURES = [
  "Unlimited testimonials",
  "Unlimited screenshot AI + batch upload",
  "Unlimited Testimonial → Tweet drafts",
  "Auto-sync from App Store, Chrome Web Store, Play Store, Product Hunt",
  "URL import — X, LinkedIn, Reddit, HN, Product Hunt",
  "Unlimited collection forms + widgets",
  "Unlimited video testimonials",
  "Public Wall of Love URL",
  "All layouts (Grid, Masonry, Carousel, List, Marquee)",
  "Custom branding + colors",
  "Remove 'Powered by' watermark",
  "Curate different testimonials per widget",
  "Analytics dashboard",
  "Priority support",
] as const;

export const PRO_AI_FEATURES = [
  "Everything in Pro",
  "Ask My Wall — embeddable AI chatbot that answers visitors from your testimonials",
  "Wall Score — unlimited audits + weekly emailed report",
  "Wall Score trend graph — track proof strength over time",
  "Wall Score benchmark — compare against category median",
  "Deep AI recommendations — specific customer prompts per weakness",
  "Auto-post Testimonial → Tweet to X + LinkedIn",
  "AI Case Study Generator (drafts from any customer's testimonials)",
  "Embeddable Trust Score badge for your site",
  "Concierge onboarding — 30-min setup call",
] as const;
