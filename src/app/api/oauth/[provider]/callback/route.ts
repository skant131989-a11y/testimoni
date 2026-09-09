import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  fetchMe,
  verifyState,
  type SocialProvider,
} from "@/lib/social-oauth";

type StatePayload = {
  workspaceId: string;
  provider: SocialProvider;
  verifier: string;
  returnTo?: string;
};

/**
 * GET /api/oauth/[provider]/callback
 *
 * Provider redirects back here with ?code=…&state=…. We verify
 * the state, exchange the code for tokens, fetch /me to store
 * the external id + handle, and upsert the SocialAccount row.
 *
 * On success, redirect to the returnTo from the state. On failure,
 * redirect with ?oauth_error=…, so the target page can surface
 * a toast instead of a 500 blank screen.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const provider = providerParam.toUpperCase() as SocialProvider;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/tweet-drafts?oauth_error=${encodeURIComponent(error)}`, req.url)
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/tweet-drafts?oauth_error=missing_params", req.url)
    );
  }

  const parsed = verifyState<StatePayload>(state);
  if (!parsed || parsed.provider !== provider) {
    return NextResponse.redirect(
      new URL("/dashboard/tweet-drafts?oauth_error=invalid_state", req.url)
    );
  }

  try {
    const tokens = await exchangeCodeForToken(provider, code, parsed.verifier);
    const me = await fetchMe(provider, tokens.accessToken);

    await prisma.socialAccount.upsert({
      where: {
        workspaceId_provider: {
          workspaceId: parsed.workspaceId,
          provider,
        },
      },
      update: {
        externalId: me.externalId,
        handle: me.handle,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
        expiresAt: tokens.expiresIn
          ? new Date(Date.now() + tokens.expiresIn * 1000)
          : null,
      },
      create: {
        workspaceId: parsed.workspaceId,
        provider,
        externalId: me.externalId,
        handle: me.handle,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
        expiresAt: tokens.expiresIn
          ? new Date(Date.now() + tokens.expiresIn * 1000)
          : null,
      },
    });

    return NextResponse.redirect(new URL(parsed.returnTo || "/dashboard/tweet-drafts", req.url));
  } catch (e) {
    console.error("OAuth callback failed", e);
    return NextResponse.redirect(
      new URL("/dashboard/tweet-drafts?oauth_error=token_exchange", req.url)
    );
  }
}
