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
  // Anything with "test" / "temp" / "fake" / "sample" / "example"
  // anywhere in the local part is a QA account, not a real signup.
  /^[^@]*(?:test|temp|fake|sample|example|qa|demo)[^@]*@/i,
];

/**
 * Whitelist-shaped name filter. Real first names:
 *   - Start with a letter (not a digit)
 *   - Contain only letters, apostrophes, hyphens
 *   - Are 2+ characters
 *
 * Rejects (returns null):
 *   - "Test123" / "user01" / "admin2" — anything with digits
 *   - "test" / "TEST" / "Testing" — starts with test/user/admin/etc.
 *   - "shashi" — Neha's dev-testing name
 *   - Long lowercase blobs (bot / password-manager garbage)
 *   - Literal emails as name
 */
function firstNameOnly(rawName: string | null, email: string): string | null {
  const n = (rawName || "").trim();
  if (n.length < 2) return null;
  if (/^[a-z]{20,}$/i.test(n)) return null; // wall-of-chars
  if (/^[a-z0-9._-]+@/i.test(n)) return null; // literal email

  // Take the first whitespace-delimited token.
  const first = n.split(/\s+/)[0];
  if (!first || first.length < 2) return null;

  // Whitelist: letters (+ apostrophes / hyphens) only. Catches
  // "Test123", "user01", any name with digits or special chars.
  if (!/^[a-zA-Z][a-zA-Z'-]+$/.test(first)) return null;

  // Cap length at 12 chars. Common longest first names are ~11
  // ("Christopher", "Bartholomew"). Bot-generated blobs like
  // "Jwilsonsankari" (14 chars, two-word glue) get caught without
  // punishing real long names. If a real "Anastasiaa" (10) shows
  // up they still pass; if a real "Constantinos" (12) shows up
  // they still pass at the boundary.
  if (first.length > 12) return null;

  // Blacklist of "obvious placeholder" starts. Case-insensitive
  // prefix match — catches "test", "Test123", "TestUser", "testing"
  // (was previously an EXACT match, which is why Test123 slipped
  // through). Also skips Neha's own dev accounts.
  const lower = first.toLowerCase();
  const BAD_PREFIXES = [
    "test",
    "user",
    "admin",
    "demo",
    "sample",
    "fake",
    "temp",
    "qa",
    "hello",
    "hi",
    "new",
    "example",
    "shashi", // Neha's dev-testing name
    "neha", // founder's own accounts (email filter covers most; belt & braces)
  ];
  if (BAD_PREFIXES.some((p) => lower.startsWith(p))) return null;

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
