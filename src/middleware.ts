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
 * tooling. IMPORTANT — do NOT try to match `Chrome/\d+\.0\.0\.0`.
 * Google's User-Agent Reduction (rolled out through 2022) means real
 * Chrome now emits exactly that format:
 *   Chrome/131.0.0.0 Safari/537.36
 * So the `.0.0.0` is universal, not a bot tell.
 *
 * We stick to signals that are actually specific to headless
 * automation and script clients:
 *   - Explicit HeadlessChrome flag
 *   - Named automation frameworks in the UA
 *   - Named crawlers/bots
 *   - Script clients (curl/wget/python-requests/etc.)
 *   - Empty UA (any real browser sends one)
 *
 * This catches maybe 30-40% of the seeder fleet at zero false-
 * positive risk. The rest is Turnstile's job.
 */
const BOT_UA_PATTERNS: RegExp[] = [
  /headlesschrome/i,                                // Explicit headless
  /puppeteer|playwright|selenium|phantomjs/i,       // Automation frameworks
  /\b(bot|spider|crawler|scraper|scrapy)\b/i,       // Named crawlers
  /^(python-requests|curl|wget|go-http-client|node-fetch|okhttp|libwww-perl|http_request2)/i,
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
