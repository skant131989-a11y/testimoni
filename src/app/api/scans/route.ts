import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAndIncrement } from "@/lib/ask-rate-limit";
import { buildTeaser, type ScanResult } from "@/lib/scan-report";
import { normalizeUrl, runUrlScan } from "@/lib/url-scan";

/**
 * POST /api/scans
 *
 * Given a website URL, discover PUBLIC customer mentions of every
 * kind (not just praise — see "Find My Proof" at
 * /api/tools/find-proof for the positive-only tool this is built
 * next to, untouched) and classify each into one or more of seven
 * categories (a mention can be both praise and an outcome, etc).
 * Returns the free teaser view (see src/lib/scan-report.ts for the
 * gating rule) — the Quick/Deep report is only ever served from
 * GET /api/scans/[id] or POST /verify with a paid unlock token.
 *
 * Same two-tier provider strategy as Find My Proof:
 *   - Tavily search + Groq classification — cheap, primary path.
 *   - Claude web_search — fallback when Tavily is unavailable or
 *     the primary path comes back with zero mentions. Capped
 *     globally (CLAUDE_FALLBACK_DAILY_CAP) since it's a much
 *     costlier tool-use call than the plain summary below.
 *
 * One extra call beyond Find My Proof: after mentions are
 * classified, a single Claude call (CHAT_MODEL, no tools) writes the
 * polished 4-line summary. This is the one call worth paying for
 * Claude-quality prose — it's what a visitor reads first and what
 * drives the $9 unlock decision. It only runs once per *new* scan;
 * cached scans (24h TTL, keyed by normalized URL) skip discovery,
 * classification, and summary entirely.
 */

const BODY = z.object({
  url: z.string().min(4).max(500),
  twitterHandles: z.array(z.string().max(40)).max(10).optional(),
  linkedinUrl: z.string().max(200).optional(),
  extra: z.string().max(500).optional(),
});

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function ipFrom(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const normalized = normalizeUrl(body.url);
  if (!normalized) {
    return NextResponse.json(
      { error: "That doesn't look like a valid URL. Try something like acme.com" },
      { status: 400 }
    );
  }

  // Cache hit — return the teaser instantly, no API cost, and no
  // rate-limit charge. Checked before the rate limit so re-checking
  // a domain you already scanned today never burns quota — only a
  // genuinely new discovery run below does that.
  const cached = await prisma.urlScan.findUnique({ where: { normalizedUrl: normalized } });
  if (cached && Date.now() - cached.refreshedAt.getTime() < CACHE_TTL_MS) {
    return NextResponse.json({
      id: cached.id,
      ...buildTeaser(cached.resultJson as unknown as ScanResult),
      cached: true,
    });
  }

  const ip = ipFrom(req);
  const rate = checkAndIncrement("scan-create", ip, 5);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "You've used today's free scans.",
        signupUrl: "/signup?src=customer_voice_rate_limit",
      },
      { status: 429 }
    );
  }

  const out = await runUrlScan(normalized, {
    twitterHandles: body.twitterHandles,
    linkedinUrl: body.linkedinUrl,
    extra: body.extra,
    allowClaude: true,
  });
  if (!out) {
    return NextResponse.json(
      { error: "The search didn't return any content — please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    id: out.id,
    ...buildTeaser(out.result),
    cached: false,
    provider: out.provider,
  });
}
