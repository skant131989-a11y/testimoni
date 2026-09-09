/**
 * Single source of truth for what's in Free vs Pro. Both the home
 * page's pricing preview and the full /pricing page import from
 * this file, so a copy change on one lands on the other for free.
 *
 * Rules:
 *   - Same lists on home and /pricing (parity across surfaces).
 *   - Pro list is intentionally longer than Free so the value gap
 *     is visible at a glance. Anytime you add a Free feature, add
 *     the corresponding upgraded Pro feature too so Pro stays ahead.
 *   - Keep phrasing consistent — don't hand-edit one page's copy
 *     without updating this file.
 */

export const FREE_FEATURES = [
  "10 testimonials",
  "3 free screenshot extractions (AI)",
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
  "Auto-sync from App Store, Play Store, Product Hunt, Chrome Web Store",
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
