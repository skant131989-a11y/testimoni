import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public recent-signups endpoint for the home page's live ticker.
 *
 * Returns first names + relative time only — NO emails, no
 * workspace names, no ids. Anyone hitting this endpoint gets the
 * same data anyone else does; it's meant for consumption by the
 * anonymous marketing surface.
 *
 * Filters out:
 *   - Demo accounts (demo-*@testimoni.dev)
 *   - Neha's own accounts (founder / hello@testimoni.io / neha@)
 *   - Auto-generated ugly names (empty, single-char, matches an
 *     email local part exactly — usually password-manager garbage)
 *   - Anything older than 24h (feels stale)
 *
 * Caches the response for 60 seconds (s-maxage) so a spike of home-
 * page traffic doesn't hit Prisma repeatedly.
 */

const NOISE_EMAIL_PATTERNS = [
  /^demo-[a-f0-9]+@testimoni\.dev$/i,
  /^hello@testimoni\.io$/i,
  /^neha@testimoni\.io$/i,
  /^neha\.singh\.founder@gmail\.com$/i,
];

function firstNameOnly(rawName: string | null, email: string): string | null {
  const n = (rawName || "").trim();
  // Password-manager garbage / bot-shaped names — skip.
  if (n.length < 2) return null;
  if (/^[a-z]{20,}$/i.test(n)) return null; // wall-of-chars
  if (/^[a-z0-9._-]+@/i.test(n)) return null; // literal email
  // Take the first whitespace-delimited token, Title-cased.
  const first = n.split(/\s+/)[0];
  if (!first) return null;
  // Reject "test", "user", "admin"-ish names — probably not real.
  if (/^(test|user|admin|hello|hi|new|demo)$/i.test(first)) return null;
  return first[0].toUpperCase() + first.slice(1).toLowerCase();
}

export async function GET() {
  const since = new Date();
  since.setHours(since.getHours() - 24);

  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: since },
      NOT: {
        OR: [
          { email: { startsWith: "demo-" } },
          { email: { in: [
            "hello@testimoni.io",
            "neha@testimoni.io",
            "neha.singh.founder@gmail.com",
          ]}},
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { name: true, email: true, createdAt: true },
  });

  const now = Date.now();
  const signups = users
    .filter((u) => !NOISE_EMAIL_PATTERNS.some((re) => re.test(u.email)))
    .map((u) => {
      const first = firstNameOnly(u.name, u.email);
      if (!first) return null;
      const minutesAgo = Math.max(
        1,
        Math.round((now - u.createdAt.getTime()) / 60000)
      );
      return { name: first, minutesAgo };
    })
    .filter(Boolean)
    .slice(0, 10); // Cap at 10 so ticker doesn't rotate forever

  return NextResponse.json(
    { signups },
    {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60",
      },
    }
  );
}
