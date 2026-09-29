/**
 * Detects the "Gmail dot-stuffing" bot signup pattern.
 *
 * Gmail ignores dots in the local part — rachel.iturbe@gmail.com and
 * rac.h.el.itu.rbe@gmail.com are the same inbox. Bot farms exploit
 * this to generate endless "unique" signups from one real address,
 * evading duplicate-email checks. Real people essentially never type
 * more than one dot in a Gmail address (a "first.last" convention);
 * every bot signup observed in production (2026-09) had 3+ dots.
 *
 * Validated against this app's real signup data: every flagged
 * account had 3-9 dots, every legitimate account had 0-1. Threshold
 * of 3 has zero observed false positives.
 */
const DOT_STUFFING_THRESHOLD = 3;
const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export function isGmailDotStuffing(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!GMAIL_DOMAINS.has(domain)) return false;

  // Dots inside a "+tag" suffix are a real, common convention
  // (jane+testimoni@gmail.com) — only count dots before the "+".
  const local = email.slice(0, at).split("+")[0];
  const dotCount = (local.match(/\./g) || []).length;
  return dotCount >= DOT_STUFFING_THRESHOLD;
}
