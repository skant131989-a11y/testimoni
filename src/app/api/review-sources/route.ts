import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getAuthUser,
  getDbUserWithWorkspace,
  loadDbUserWithWorkspaceFresh,
} from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { parseAnySourceUrl, availablePlatforms } from "@/lib/review-sources/registry";

/**
 * Review sources API.
 *   GET  /api/review-sources        — list this workspace's sources
 *   POST /api/review-sources        — connect a new source (Pro only)
 *
 * All routes require a signed-in user. Only Pro workspaces can
 * create new sources — GET is available to Free too so we can
 * show an empty state + upsell.
 */

const CREATE_SCHEMA = z.object({
  url: z.string().url().max(500),
  minRating: z.number().int().min(1).max(5).optional(),
  autoApprove: z.boolean().optional(),
});

async function requirePro() {
  const authUser = await getAuthUser();
  if (!authUser) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const dbUser =
    (await getDbUserWithWorkspace()) ?? (await loadDbUserWithWorkspaceFresh());
  const membership = dbUser?.workspaceMembers[0];
  if (!membership) {
    return {
      error: NextResponse.json({ error: "No workspace found." }, { status: 400 }),
    };
  }
  const plan = getEffectivePlan(
    membership.workspace.slug,
    membership.workspace.subscription?.plan,
  );
  return {
    workspaceId: membership.workspaceId,
    plan,
  };
}

export async function GET() {
  const ctx = await requirePro();
  if ("error" in ctx) return ctx.error;

  const sources = await prisma.reviewSource.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    sources,
    plan: ctx.plan,
    platforms: availablePlatforms(),
  });
}

export async function POST(req: Request) {
  const ctx = await requirePro();
  if ("error" in ctx) return ctx.error;

  if (ctx.plan !== "PRO") {
    return NextResponse.json(
      {
        error: "Review source syncing is a Pro feature.",
        upgradeRequired: true,
      },
      { status: 402 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CREATE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const detected = parseAnySourceUrl(parsed.data.url);
  if (!detected) {
    return NextResponse.json(
      {
        error:
          "We couldn't identify that URL. Supported: App Store, Play Store, Product Hunt, Chrome Web Store.",
      },
      { status: 400 },
    );
  }

  // Enforce the (workspace, platform, externalAppId) uniqueness at
  // the app layer to give a clean error message; the DB has the
  // same constraint as a safety net.
  const existing = await prisma.reviewSource.findFirst({
    where: {
      workspaceId: ctx.workspaceId,
      platform: detected.platform,
      externalAppId: detected.externalAppId,
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You've already connected this source.", sourceId: existing.id },
      { status: 409 },
    );
  }

  const source = await prisma.reviewSource.create({
    data: {
      workspaceId: ctx.workspaceId,
      platform: detected.platform,
      externalAppId: detected.externalAppId,
      displayName: detected.displayName,
      sourceUrl: parsed.data.url,
      minRating: parsed.data.minRating ?? 4,
      autoApprove: parsed.data.autoApprove ?? false,
    },
  });

  return NextResponse.json({ source }, { status: 201 });
}
