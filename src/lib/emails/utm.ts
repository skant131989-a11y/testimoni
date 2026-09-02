/**
 * Appends UTM tracking params to a URL that we own (testimoni.io).
 *
 * Won't touch:
 * - mailto: / tel: schemes
 * - non-http(s) protocols (data:, javascript:, etc.)
 * - external domains (x.com, linkedin.com, github.com, etc.) — those
 *   don't accept our UTM tracking anyway
 *
 * Preserves any existing query string / hash on the URL and dedupes
 * params if the URL already carries a utm_* key with the same name.
 */
export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
}

export function withUtm(rawUrl: string, params: UtmParams): string {
  if (!rawUrl) return rawUrl;
  if (/^(mailto:|tel:|javascript:|data:)/i.test(rawUrl)) return rawUrl;
  if (!/^https?:\/\//i.test(rawUrl)) return rawUrl;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  // Only tag URLs we own so we don't strap UTMs onto x.com / linkedin.com.
  const host = url.hostname.toLowerCase();
  const ownsHost =
    host === "testimoni.io" ||
    host.endsWith(".testimoni.io") ||
    host === "localhost" ||
    host === "127.0.0.1";
  if (!ownsHost) return rawUrl;

  url.searchParams.set("utm_source", params.source);
  url.searchParams.set("utm_medium", params.medium);
  url.searchParams.set("utm_campaign", params.campaign);
  if (params.content) {
    url.searchParams.set("utm_content", params.content);
  }
  return url.toString();
}
