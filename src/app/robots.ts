import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

// A crawler that matches a named user-agent group ignores the "*"
// group entirely, so these must be repeated on every group — otherwise
// the AI bots below would be allowed into /dashboard/, /api/ etc.
const DISALLOW = [
  "/dashboard/",
  "/api/",
  "/auth/",
  "/login",
  "/signup",
  "/_test/",
];

// Explicitly welcome AI answer-engine crawlers so Testimoni surfaces
// in ChatGPT / Perplexity / Claude / Gemini / Apple Intelligence
// / Meta AI answers. Explicit "allow" beats implicit — some crawlers
// (Applebot-Extended, Meta-ExternalAgent) default to no-fetch on
// sites that don't call them out.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "Claude-Web",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "CCBot",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
