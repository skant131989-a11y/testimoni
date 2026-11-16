import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAndIncrement } from "@/lib/ask-rate-limit";
import { normalizeUrl } from "@/lib/url-scan";

/**
 * POST /api/watch
 *
 * "Email me when you find something": saved from the box on an empty Find
 * my praise or Customer Voice result. The recheck cron (see
 * /api/cron/watch-recheck) scans the site again a few times and sends one
 * email if more turns up. Single opt-in; every email carries an
 * unsubscribe link, and the watch expires after 28 days.
 */
const BODY = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  tool: z.enum(["find-proof", "customer-voice"]),
  url: z.string().max(500).optional(),
  scanId: z.string().max(60).optional(),
});

const WATCH_DAYS = 28;

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (!checkAndIncrement(ip, "watch-create", 5).allowed) {
    return NextResponse.json({ error: "Too many requests today. Please try again tomorrow." }, { status: 429 });
  }

  let normalized: string | null = null;
  if (body.scanId) {
    const scan = await prisma.urlScan.findUnique({ where: { id: body.scanId }, select: { normalizedUrl: true } });
    normalized = scan?.normalizedUrl ?? null;
  } else if (body.url) {
    normalized = normalizeUrl(body.url);
  }
  if (!normalized) {
    return NextResponse.json({ error: "We couldn't tell which website this is for." }, { status: 400 });
  }

  // Someone who asked us to stop emailing them: say yes, save nothing.
  const suppressed = await prisma.outreachSuppression.findFirst({
    where: { email: { equals: body.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (suppressed) return NextResponse.json({ ok: true });

  const expiresAt = new Date(Date.now() + WATCH_DAYS * 24 * 60 * 60 * 1000);
  await prisma.scanWatch.upsert({
    where: { email_normalizedUrl: { email: body.email, normalizedUrl: normalized } },
    create: { email: body.email, normalizedUrl: normalized, tool: body.tool, expiresAt },
    // Asking again re-opens a finished watch.
    update: { tool: body.tool, active: true, checks: 0, notifiedAt: null, lastCheckedAt: null, expiresAt },
  });

  return NextResponse.json({ ok: true });
}
