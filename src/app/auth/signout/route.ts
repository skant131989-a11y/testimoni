import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /auth/signout — clears the Supabase session and redirects home.
 * Invoked by the sign-out form in the dashboard header.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  return NextResponse.redirect(new URL("/", origin), { status: 303 });
}

// Also handle GET so a direct visit doesn't 404
export async function GET(request: Request) {
  return POST(request);
}
