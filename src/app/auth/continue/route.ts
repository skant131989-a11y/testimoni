import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/continue?next=/some/path
 *
 * Where the emailed-code sign-in lands after the code is accepted. One
 * form now both logs people in and creates accounts, so this decides which
 * it was: an account created in the last 90 minutes (a code stays valid
 * about an hour) goes to the welcome flow, everyone else to `next`.
 * Google does the same thing in /callback.
 */
const NEW_USER_WINDOW_MS = 90 * 60 * 1000;
const WELCOME_URL = "/dashboard/welcome";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  let next = searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/dashboard";

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(`${origin}/login`);

  const createdAt = data.user.created_at ? new Date(data.user.created_at).getTime() : 0;
  const destination = Date.now() - createdAt < NEW_USER_WINDOW_MS ? WELCOME_URL : next;

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${destination}`);
  }
  return NextResponse.redirect(`${origin}${destination}`);
}
