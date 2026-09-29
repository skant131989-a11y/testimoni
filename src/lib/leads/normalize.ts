/**
 * Normalize a free-form website string (as found in a comment, a
 * Product Hunt post, etc.) to the bare hostname used as the lead
 * dedup key — same shape as scan-report's normalizeUrl, minus the
 * path (a lead is keyed on the company, not a specific page).
 * Returns null for anything that isn't a plausible domain.
 */
export function normalizeWebsite(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    // Reject obviously-not-a-company-domain hosts (link shorteners,
    // the platforms themselves, generic doc/social hosts) — these
    // show up when a candidate's "website" field is actually a link
    // to the HN thread, a Twitter profile, etc. rather than the
    // product's own site.
    const REJECT_HOSTS = new Set([
      "news.ycombinator.com",
      "producthunt.com",
      "reddit.com",
      "x.com",
      "twitter.com",
      "linkedin.com",
      "github.com",
      "medium.com",
      "notion.site",
      "bit.ly",
      "t.co",
      "google.com",
    ]);
    if (REJECT_HOSTS.has(host)) return null;
    if (!host.includes(".")) return null;
    return host;
  } catch {
    return null;
  }
}

export function websiteToUrl(website: string): string {
  return `https://${website}`;
}
