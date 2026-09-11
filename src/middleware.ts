import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Routes where we care about blocking bot signups. Marketing routes
 * (/, /pricing, /features …) are intentionally left open so search
 * indexers and preview scrapers can still see them.
 */
const BOT_SENSITIVE_PATHS = ["/signup", "/login", "/forgot-password", "/reset-password"];

const BOT_SENSITIVE_APIS = [
  "/api/testimonials",           // wall writes
  "/api/testimonials/bulk-from-anon",
  "/api/tools/find-proof",       // paid Anthropic surface
  "/api/tools/screenshot-to-testimonial",
  "/api/ask-my-wall",
];

/**
 * Fingerprint patterns that separate real browsers from headless-bot
 * tooling. The `Chrome/\d+\.0\.0\.0` catch is the biggest win: real
 * Chrome always ships a real build number (`Chrome/130.0.6723.116`),
 * while Puppeteer / Playwright defaults to `Chrome/XXX.0.0.0`. This
 * one regex kills the majority of account-seeding bots we've seen.
 *
 * The regexes below are ordered by frequency of hit so the common
 * cases short-circuit early.
 */
const BOT_UA_PATTERNS: RegExp[] = [
  /chrome\/\d+\.0\.0\.0/i,                          // Puppeteer / Playwright default
  /headlesschrome/i,                                // Explicit headless
  /\b(bot|spider|crawler|scraper|scrapy)\b/i,       // Named crawlers
  /^(python-requests|curl|wget|go-http-client|node-fetch|okhttp|libwww-perl|http_request2)/i,
  /puppeteer|playwright|selenium|phantomjs/i,
];

function isBotUA(ua: string): boolean {
  if (!ua) return true; // empty UA = script client
  return BOT_UA_PATTERNS.some((re) => re.test(ua));
}

function matchesSensitivePath(pathname: string): boolean {
  if (BOT_SENSITIVE_PATHS.includes(pathname)) return true;
  return BOT_SENSITIVE_APIS.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Edge-first bot block on auth + paid AI routes ────────────
  // Runs before any Supabase / DB work. If the UA fingerprint says
  // "headless automation", we hard-403 the request. Zero cost for
  // real users, blocks bots before they can spawn accounts or burn
  // Anthropic tokens.
  if (matchesSensitivePath(pathname)) {
    const ua = request.headers.get("user-agent") || "";
    if (isBotUA(ua)) {
      return new NextResponse(
        JSON.stringify({ error: "forbidden" }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        },
      );
    }
  }

  const isPublicPage =
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/features" ||
    pathname === "/demo" ||
    pathname === "/contact" ||
    pathname.startsWith("/collect/");

  if (isPublicPage) {
    return NextResponse.next();
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === "your-supabase-url"
  ) {
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/widget|api/collect|api/submissions|embed|_test|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
