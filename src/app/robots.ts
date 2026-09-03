import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/auth/",
          "/login",
          "/signup",
          "/_test/",
        ],
      },
      // Explicitly welcome AI answer-engine crawlers so Testimoni surfaces
      // in ChatGPT / Perplexity / Claude / Gemini / Apple Intelligence
      // / Meta AI answers. Explicit "allow" beats implicit — some crawlers
      // (Applebot-Extended, Meta-ExternalAgent) default to no-fetch on
      // sites that don't call them out.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Perplexity-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "Meta-ExternalAgent", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "cohere-ai", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
