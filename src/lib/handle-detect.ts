/**
 * Handle detection — fetches a product's homepage HTML and scrapes
 * out X/Twitter, LinkedIn, and GitHub handles from anchor tags.
 *
 * Used as a fallback when the user hasn't explicitly provided
 * handles in the /tools/find-my-proof "Add references" section.
 *
 * ── Reliability notes ─────────────────────────────────────────
 * - Fast, ~500ms budget. Silent-fail on any error: we return an
 *   empty result rather than throwing, because the caller still
 *   has the URL + brand name to search against.
 * - Some sites render nav/footer entirely via JS (Vercel-style).
 *   We won't catch handles there; that's what the user-provided
 *   handles field is for.
 * - We deduplicate handles case-insensitively and strip common
 *   noise (share/tweet/share-button/intent).
 */

const NOISE_HANDLES = new Set([
  "share",
  "tweet",
  "intent",
  "home",
  "hashtag",
  "search",
  "explore",
  "notifications",
  "messages",
  "settings",
  "login",
  "signup",
  "compose",
]);

export interface DetectedHandles {
  twitter: string[];
  linkedin: string[];
  github: string[];
}

const EMPTY: DetectedHandles = { twitter: [], linkedin: [], github: [] };

export async function detectHandlesFromUrl(
  url: string
): Promise<DetectedHandles> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Present as a normal browser so paywalled/anti-bot sites
        // don't 403 or return a stub page.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
          "(KHTML, like Gecko) Version/17.0 Safari/605.1.15 Testimoni-Bot/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return EMPTY;
    const html = await res.text();
    return extractHandles(html);
  } catch {
    return EMPTY;
  }
}

export function extractHandles(html: string): DetectedHandles {
  // Regex over the whole HTML — cheap, no DOM parse needed. We
  // grab every href-looking URL to twitter/x/linkedin/github and
  // capture the first path segment.
  const twitter = new Set<string>();
  const linkedin = new Set<string>();
  const github = new Set<string>();

  const twitterRe =
    /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]{2,20})(?:[/?#"'>\s]|$)/gi;
  const linkedinRe =
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([A-Za-z0-9\-_.]{2,60})(?:[/?#"'>\s]|$)/gi;
  const githubRe =
    /https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9\-]{1,39})(?:[/?#"'>\s]|$)/gi;

  let m: RegExpExecArray | null;
  while ((m = twitterRe.exec(html))) {
    const h = m[1];
    if (!NOISE_HANDLES.has(h.toLowerCase())) twitter.add(h);
  }
  while ((m = linkedinRe.exec(html))) linkedin.add(m[1]);
  while ((m = githubRe.exec(html))) {
    const h = m[1];
    if (!NOISE_HANDLES.has(h.toLowerCase())) github.add(h);
  }

  return {
    twitter: Array.from(twitter).slice(0, 3),
    linkedin: Array.from(linkedin).slice(0, 2),
    github: Array.from(github).slice(0, 2),
  };
}
