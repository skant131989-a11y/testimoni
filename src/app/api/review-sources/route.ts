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
 *   POST /api/review-sources        — connect a new source
 *
 * Connecting is FREE on every plan — a Free user can paste an
 * App Store / Play Store / Product Hunt / Chrome Web Store URL
 * and pull the reviews once. The plan cap (Free = 10 testimonials
 * total) is what gates volume, not the feature itself. autoApprove
 * stays Pro-only: on Free, imported reviews land in the pending
 * queue for manual review. Auto-sync (scheduled background pulls)
 * is also Pro-only — see the sync cron.
 */

const CREATE_SCHEMA = z.object({
  url: z.string().url().max(500),
  minRating: z.number().int().min(1).max(5).optional(),
  autoApprove: z.boolean().optional(),
});

async function resolveWorkspace() {
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
  const ctx = await resolveWorkspace();
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
  const ctx = await resolveWorkspace();
  if ("error" in ctx) return ctx.error;

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

  // autoApprove is a Pro perk. On Free plans, force it off so
  // imported reviews land in the pending queue where the user has
  // to approve each one — same curation flow as any other testimonial.
  const requestedAutoApprove = parsed.data.autoApprove ?? false;
  const autoApprove = ctx.plan === "PRO" ? requestedAutoApprove : false;

  const source = await prisma.reviewSource.create({
    data: {
      workspaceId: ctx.workspaceId,
      platform: detected.platform,
      externalAppId: detected.externalAppId,
      displayName: detected.displayName,
      sourceUrl: parsed.data.url,
      minRating: parsed.data.minRating ?? 4,
      autoApprove,
    },
  });

  return NextResponse.json({ source }, { status: 201 });
}
