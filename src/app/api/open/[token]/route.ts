import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifySignupToken } from "@/lib/signup-link-token";

/**
 * POST /api/open/[token]
 *
 * Signs in the one person a reminder email's signed link names. Opening the
 * link never does this: only the button on the /open page does. It only works
 * for an account that has never signed in, so a link that has been used (or was
 * forwarded after its owner got in) stops working.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const verified = verifySignupToken(token);
  if (!verified) return NextResponse.json({ error: "expired" }, { status: 401 });

  try {
    const admin = createAdminClient();
    const { data: found, error: findErr } = await admin.auth.admin.getUserById(verified.authUserId);
    const user = found?.user;
    if (findErr || !user?.email) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (user.last_sign_in_at) return NextResponse.json({ error: "already_signed_in" }, { status: 409 });

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
    const hashed = link?.properties?.hashed_token;
    if (linkErr || !hashed) return NextResponse.json({ error: "link_failed" }, { status: 502 });

    // Verify the one-time token on the server so the session cookies are set on this response.
    const supabase = await createClient();
    const { data: session, error: verifyErr } = await supabase.auth.verifyOtp({ token_hash: hashed, type: "magiclink" });
    if (verifyErr || !session.session) return NextResponse.json({ error: "verify_failed" }, { status: 502 });

    return NextResponse.json({ ok: true, next: "/dashboard/welcome" });
  } catch (e) {
    console.warn("[api/open] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
