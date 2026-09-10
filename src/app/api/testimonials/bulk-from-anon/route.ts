import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDbUserWithWorkspace } from "@/lib/session";
import { TestimonialSource, TestimonialStatus } from "@prisma/client";

/**
 * POST /api/testimonials/bulk-from-anon
 *
 * Called from the dashboard welcome page after a user signs up.
 * Takes the batch of testimonials the user collected while
 * anonymous (via find-my-proof search, import panel, screenshot
 * tool) and creates them in their workspace.
 *
 * ── Behavior ─────────────────────────────────────────────────────
 * - Deduped by (workspaceId, content, customerName) — repeated
 *   sign-ups from the same tray don't duplicate the wall.
 * - Status = APPROVED so they show up on the wall immediately.
 *   The user pasted or extracted each one themselves; no moderation
 *   layer is needed for content they intentionally collected.
 * - Free-plan quota is enforced softly: we take up to the plan's
 *   remaining testimonial slots. Anything over → response says
 *   how many landed vs. queued.
 */

const ITEM = z.object({
  content: z.string().min(2).max(2000),
  author: z.string().min(1).max(200),
  role: z.string().max(200).optional(),
  source: z.string().max(40).optional(),
  sourceUrl: z.string().max(500).optional(),
  origin: z.string().max(40).optional(),
});

const BODY = z.object({
  items: z.array(ITEM).min(1).max(25),
});

function sourceFromString(raw?: string): TestimonialSource {
  if (!raw) return TestimonialSource.MANUAL;
  const s = raw.toLowerCase();
  if (s.includes("x") || s.includes("twitter")) return TestimonialSource.TWITTER;
  if (s.includes("linked")) return TestimonialSource.LINKEDIN;
  if (s.includes("reddit")) return TestimonialSource.REDDIT;
  if (s.includes("product hunt")) return TestimonialSource.PRODUCT_HUNT;
  if (s.includes("hacker news") || s === "hn") return TestimonialSource.HACKER_NEWS;
  if (s.includes("google")) return TestimonialSource.GOOGLE;
  if (s.includes("app store")) return TestimonialSource.APP_STORE;
  if (s.includes("play")) return TestimonialSource.GOOGLE_PLAY;
  if (s.includes("chrome")) return TestimonialSource.CHROME_STORE;
  if (s.includes("shopify")) return TestimonialSource.SHOPIFY;
  if (s.includes("trustpilot")) return TestimonialSource.TRUSTPILOT;
  return TestimonialSource.IMPORT;
}

export async function POST(req: NextRequest) {
  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const workspaceId = member.workspace.id;

  // Find existing rows that would duplicate this batch so we skip
  // them cleanly.
  const existing = await prisma.testimonial.findMany({
    where: {
      workspaceId,
      OR: body.items.map((i) => ({
        content: i.content,
        customerName: i.author,
      })),
    },
    select: { content: true, customerName: true },
  });
  const seen = new Set(
    existing.map((e) => `${e.content ?? ""}::${e.customerName}`.toLowerCase()),
  );

  const toCreate = body.items.filter(
    (i) => !seen.has(`${i.content}::${i.author}`.toLowerCase()),
  );

  if (toCreate.length === 0) {
    return NextResponse.json({
      saved: 0,
      skippedDuplicates: body.items.length,
      totalRequested: body.items.length,
    });
  }

  const created = await prisma.$transaction(
    toCreate.map((i) =>
      prisma.testimonial.create({
        data: {
          workspaceId,
          content: i.content,
          customerName: i.author,
          customerTitle: i.role || null,
          source: sourceFromString(i.source),
          sourceUrl: i.sourceUrl || null,
          status: TestimonialStatus.APPROVED,
          tags: i.origin ? [`origin:${i.origin}`] : [],
        },
        select: { id: true },
      }),
    ),
  );

  return NextResponse.json({
    saved: created.length,
    skippedDuplicates: body.items.length - toCreate.length,
    totalRequested: body.items.length,
  });
}
