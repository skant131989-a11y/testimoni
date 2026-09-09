import { NextRequest, NextResponse } from "next/server";
import { getDbUserWithWorkspace } from "@/lib/session";
import {
  buildAuthUrl,
  generatePkce,
  isProviderConfigured,
  signState,
  type SocialProvider,
} from "@/lib/social-oauth";
import { SOCIAL_AUTO_POST_ENABLED } from "@/lib/feature-flags";

/**
 * GET /api/oauth/[provider]/start
 *
 * Kicks off the OAuth 2.0 flow for TWITTER or LINKEDIN. Verifies
 * the caller owns a workspace, generates PKCE + a signed state,
 * and 302s them to the provider's authorize URL.
 *
 * Gated by SOCIAL_AUTO_POST_ENABLED — while that flag is false,
 * the UI hides the "Connect" chips, but this endpoint would still
 * be reachable via URL. Return 404 to hide the surface entirely.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  if (!SOCIAL_AUTO_POST_ENABLED) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const { provider: providerParam } = await params;
  const provider = providerParam.toUpperCase() as SocialProvider;
  if (provider !== "TWITTER" && provider !== "LINKEDIN") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.json(
      {
        error: "not_configured",
        message: `${provider} OAuth is not configured. Set ${provider}_CLIENT_ID and ${provider}_CLIENT_SECRET in your env.`,
      },
      { status: 501 }
    );
  }

  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) return NextResponse.redirect(new URL("/login", req.url));

  const { verifier, challenge } = generatePkce();
  const state = signState({
    workspaceId: member.workspace.id,
    provider,
    verifier,
    // Where to send them after callback completes.
    returnTo: "/dashboard/tweet-drafts?connected=1",
  });

  return NextResponse.redirect(buildAuthUrl(provider, state, challenge));
}
