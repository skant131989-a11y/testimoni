import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const WELCOME_URL = "/dashboard/welcome";

// If the user was created within this many seconds of hitting /callback,
// treat them as brand-new and force the onboarding landing regardless of
// the ?next= param. Covers the "signed up via /login's Google button"
// edge case that a hardcoded ?next= couldn't reach.
const NEW_USER_WINDOW_SECONDS = 90;

/**
 * Categorize a Supabase auth error message into a small set of reasons
 * the login page can translate into user-friendly copy. Silently
 * swallowing the underlying message is the old failure mode we're
 * moving away from — instead we log + tag so the user sees "your link
 * expired, request a new one" instead of the useless
 * "auth_callback_error".
 */
function classifyCallbackError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("expired") ||
    m.includes("invalid grant") ||
    m.includes("invalid_grant") ||
    m.includes("otp_expired")
  ) {
    return "expired";
  }
  if (m.includes("already been used") || m.includes("code_verifier")) {
    return "already_used";
  }
  if (m.includes("pkce") || m.includes("code verifier")) {
    return "pkce_mismatch";
  }
  return "unknown";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Supabase can bounce the user here with `error` + `error_description`
  // params when the sign-in link itself is invalid at the provider level
  // (expired, revoked). Handle that BEFORE looking at `code` so we don't
  // swallow the diagnostic.
  const providerError = searchParams.get("error_description") || searchParams.get("error");
  if (providerError && !code) {
    console.warn("[auth/callback] Provider returned error:", providerError);
    const reason = classifyCallbackError(providerError);
    return NextResponse.redirect(
      `${origin}/login?error=${reason}`
    );
  }

  if (!code) {
    // No code + no error → someone hit /callback without going through
    // Supabase. Not necessarily malicious (bookmark, refresh) but not a
    // valid sign-in either.
    console.warn("[auth/callback] Hit without a code parameter");
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Log the specific reason so Vercel logs give us something useful
    // — the old redirect silently ate this and left us guessing when
    // users reported "the sign-in link doesn't work."
    console.warn(
      "[auth/callback] Code exchange failed:",
      error.message,
      { status: (error as { status?: number }).status ?? null }
    );
    const reason = classifyCallbackError(error.message);
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }

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
