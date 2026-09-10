/**
 * Minimal Tavily client — free tier gives 1,000 searches/month.
 *
 * Docs: https://docs.tavily.com/docs/rest-api/api-reference
 *
 * Two shapes we care about:
 *   - `search_depth: "basic"`  → 1 credit per call, ~5 results
 *   - `search_depth: "advanced"` → 2 credits, deeper crawl, better
 *     for finding testimonials on smaller platforms
 *
 * Response is a flat array of results with title, url, content
 * (already extracted, no browser needed) — feed that straight
 * into an LLM to synthesize.
 */

export const TAVILY_ENDPOINT = "https://api.tavily.com/search";

export function hasTavily(): boolean {
  return !!process.env.TAVILY_API_KEY;
}

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  raw_content?: string | null;
}

export interface TavilySearchOpts {
  query: string;
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  includeRawContent?: boolean;
}

interface TavilyResponse {
  query: string;
  answer?: string;
  results: TavilyResult[];
  response_time?: number;
}

export async function tavilySearch(opts: TavilySearchOpts): Promise<TavilyResponse> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY not set");

  const res = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query: opts.query,
      search_depth: opts.searchDepth ?? "advanced",
      max_results: opts.maxResults ?? 10,
      include_answer: false,
      include_raw_content: opts.includeRawContent ?? false,
      include_domains: opts.includeDomains,
      exclude_domains: opts.excludeDomains,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Tavily ${res.status}: ${detail.slice(0, 300)}`);
  }

  return (await res.json()) as TavilyResponse;
}
