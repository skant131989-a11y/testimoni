/**
 * Constants shared across every surface that saves or counts
 * screenshot-extracted testimonials. Keep the tag string here as
 * the single source of truth so a rename doesn't silently divorce
 * downstream queries from the tagged rows.
 */

/** Applied to every testimonial saved via Claude Vision screenshot
 *  extraction. Used both for enforcing the Free-plan lifetime cap
 *  and for future analytics filters. */
export const SCREENSHOT_TAG = "extracted-from-screenshot";

/** Free-plan LIFETIME cap for screenshot extractions. Not a
 *  monthly window — 3 successful extractions total, then upgrade
 *  to Pro for unlimited + multi-file upload. Enforced server-side
 *  in the extraction API route. */
export const FREE_SCREENSHOT_LIMIT = 3;
