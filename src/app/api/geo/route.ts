import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geo — the visitor's country as seen by the edge (IP-based),
 * used to pick the display currency. Browser timezone can't be used for
 * this: it doesn't change with a VPN, so a visitor in the US on an
 * Indian-timezone machine (or vice versa) got the wrong currency.
 *
 * Vercel sets `x-vercel-ip-country`; Cloudflare sets `cf-ipcountry`.
 * Missing header (local dev) → country null and the client falls back
 * to the timezone guess.
 */
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const raw = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry");
  const country = raw && /^[A-Za-z]{2}$/.test(raw) && raw.toUpperCase() !== "XX" ? raw.toUpperCase() : null;
  return NextResponse.json({ country }, { headers: { "Cache-Control": "no-store" } });
}
