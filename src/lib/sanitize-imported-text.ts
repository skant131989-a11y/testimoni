/**
 * Sanitize text pulled from tweet / LinkedIn imports before it lands
 * on a Wall of Love.
 *
 * Twitter's oEmbed response gives us HTML with t.co links + trailing
 * pic.twitter.com media appendages + oEmbed's own truncation ellipsis.
 * The raw stripped text ends up looking like:
 *
 *   "Join us at https://t.co/lz6QwHUHym and grow alongside...
 *    pic.twitter.com/lboV7pDqBu"
 *
 * — which is meaningful on X but noise on a testimonials wall. This
 * helper strips those Twitter-specific artefacts so the imported
 * card shows the actual quote a customer wrote.
 *
 * Kept as a pure function so both the preview API and the persistence
 * API run the exact same cleaning logic.
 */

/**
 * Rules applied, in order:
 *   1. Remove t.co URLs (Twitter's link shortener — always noise
 *      when the text is pulled out of X's own UI).
 *   2. Remove pic.twitter.com / pic.x.com URLs — Twitter appends these
 *      to tweet text when the tweet has attached media. They're not
 *      part of the quote.
 *   3. Collapse repeated whitespace introduced by the removals.
 *   4. Trim.
 *
 * Note on the trailing "…": we DO NOT strip it. Twitter's oEmbed API
 * silently truncates long tweets and appends "…" as the only signal
 * that content was cut. Removing it makes truncated tweets read as a
 * broken sentence with no cue to the reader.
 */
export function sanitizeImportedText(input: string): string {
  if (!input) return "";

  let out = input;

  // 1) Strip Twitter t.co URLs.
  out = out.replace(/https?:\/\/t\.co\/[a-zA-Z0-9]+/g, "");

  // 2) Strip pic.twitter.com / pic.x.com media appendages.
  out = out.replace(/pic\.(?:twitter|x)\.com\/[a-zA-Z0-9]+/gi, "");

  // 3) Collapse any remaining whitespace run.
  out = out.replace(/\s+/g, " ");

  return out.trim();
}
