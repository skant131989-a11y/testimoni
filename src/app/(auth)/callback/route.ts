import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const WELCOME_URL = "/dashboard/welcome";

// If the user was created within this many seconds of hitting /callback,
// treat them as brand-new and force the onboarding landing regardless of
// the ?next= param. Covers the "signed up via /login's Google button"
// edge case that a hardcoded ?next= couldn't reach.
const NEW_USER_WINDOW_SECONDS = 90;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Auth-shape detection of a first-time user. Supabase reports
      // created_at on the user object; compare to now to decide whether
      // to force the welcome flow.
      let destination = next;
      const createdAt = data.user?.created_at
        ? new Date(data.user.created_at).getTime()
        : null;
      if (createdAt && Date.now() - createdAt < NEW_USER_WINDOW_SECONDS * 1000) {
        destination = WELCOME_URL;
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${destination}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`);
      } else {
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
