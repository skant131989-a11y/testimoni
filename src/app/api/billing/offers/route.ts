import { NextResponse } from "next/server";
import { getProOffers } from "@/lib/pro-offers";

/**
 * GET /api/billing/offers
 *
 * Which Pro price options exist right now and how many founding spots are
 * left. Public (the pricing page shows it to everyone). Briefly cached so a
 * busy page does not hit the database for every visitor.
 */
export async function GET() {
  try {
    const offers = await getProOffers();
    return NextResponse.json(offers, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json(
      { founding: { available: false, left: 0, monthly: false, annual: false }, annual: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
