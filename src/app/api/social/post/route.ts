import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDbUserWithWorkspace } from "@/lib/session";
import { postToProvider, type SocialProvider } from "@/lib/social-oauth";
import { SOCIAL_AUTO_POST_ENABLED } from "@/lib/feature-flags";

const BODY = z.object({
  provider: z.enum(["TWITTER", "LINKEDIN"]),
  text: z.string().min(1).max(2800),
});

/**
 * POST /api/social/post
 *
 * Posts { provider, text } to the caller's workspace's connected
 * account. Returns the provider's post URL. Errors surface as
 * user-visible messages the UI can toast.
 *
 * Gated by SOCIAL_AUTO_POST_ENABLED — while the flag is off,
 * this returns 404 rather than a token-exchange attempt.
 */
export async function POST(req: NextRequest) {
  if (!SOCIAL_AUTO_POST_ENABLED) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const account = await prisma.socialAccount.findUnique({
    where: {
      workspaceId_provider: {
        workspaceId: member.workspace.id,
        provider: body.provider as SocialProvider,
      },
    },
  });

  if (!account) {
    return NextResponse.json(
      { error: "not_connected", message: `Connect your ${body.provider === "TWITTER" ? "X" : "LinkedIn"} account first.` },
      { status: 400 }
    );
  }

  try {
    const result = await postToProvider(
      body.provider as SocialProvider,
      account.accessToken,
      body.text,
      account.externalId
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Post failed";
    return NextResponse.json(
      {
        error: "post_failed",
        message,
      },
      { status: 502 }
    );
  }
}
