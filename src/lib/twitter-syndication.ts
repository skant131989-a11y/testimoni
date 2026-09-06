/**
 * Fetch a tweet's canonical text via Twitter's public syndication
 * endpoint. Returns cleaner data than the older oEmbed path:
 *   - Raw text (not HTML-wrapped) with real t.co URLs — no "…"
 *     appended to full-length tweets.
 *   - Author name + screen name + avatar for card assembly.
 *   - `truncated` flag for X-Premium "note tweets" whose full body
 *     isn't reachable without authenticated GraphQL — callers can
 *     append a "…" or a "Read on X" link when this is set.
 *
 * No API key required. Endpoint format is public + used by X's own
 * embed script. If it 404s / rate limits, the caller should fall
 * back to publish.twitter.com/oembed.
 */

import { sanitizeImportedText } from "./sanitize-imported-text";

export interface SyndicationTweet {
  /** Cleaned text — t.co URLs stripped, whitespace collapsed. */
  content: string;
  /** True when the tweet is a note_tweet (long tweet) whose full
   *  body wasn't returned. UI should signal truncation. */
  truncated: boolean;
  authorName: string;
  authorScreenName: string;
  authorAvatarUrl: string | null;
  authorProfileUrl: string;
}

export async function fetchTweetViaSyndication(
  sourceUrl: string
): Promise<SyndicationTweet | null> {
  const idMatch = sourceUrl.match(/status\/(\d+)/);
  if (!idMatch) return null;
  const id = idMatch[1];

  const endpoint = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=1`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Testimoni/1.0; +https://testimoni.io)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      text?: string;
      note_tweet?: unknown;
      user?: {
        name?: string;
        screen_name?: string;
        profile_image_url_https?: string;
      };
    };

    const rawText = data.text || "";
    if (!rawText) return null;

    const user = data.user || {};
    const screenName = user.screen_name || "";

    return {
      content: sanitizeImportedText(rawText),
      truncated: Boolean(data.note_tweet),
      authorName: user.name || screenName || "Twitter user",
      authorScreenName: screenName,
      authorAvatarUrl: user.profile_image_url_https || null,
      authorProfileUrl: screenName ? `https://x.com/${screenName}` : sourceUrl,
    };
  } catch {
    return null;
  }
}
