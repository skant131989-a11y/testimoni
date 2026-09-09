import { prisma } from "@/lib/prisma";
import type { ReviewSource } from "@prisma/client";
import { ADAPTERS } from "./registry";

/**
 * Sync engine — pulls the latest reviews for a given ReviewSource,
 * dedupes against what's already imported, and writes new rows to
 * the Testimonial table.
 *
 * Idempotent by design: rerunning after a partial success is safe
 * because we dedupe on externalReviewId. Failed sync updates the
 * source row with `syncStatus=ERROR` + the error message so the
 * dashboard can surface it.
 *
 * Returns:
 *   { imported, skipped, error? }
 */
export interface SyncResult {
  imported: number;
  skipped: number;
  error?: string;
  /** True when the workspace's testimonial cap prevented some
   *  eligible reviews from being imported. The client can surface a
   *  "hit your free cap — upgrade to import the rest" message. */
  capReached?: boolean;
}

const PLATFORM_TO_TESTIMONIAL_SOURCE = {
  APP_STORE: "APP_STORE",
  GOOGLE_PLAY: "GOOGLE_PLAY",
  PRODUCT_HUNT: "PRODUCT_HUNT",
  CHROME_STORE: "CHROME_STORE",
  SHOPIFY: "SHOPIFY",
  TRUSTPILOT: "TRUSTPILOT",
} as const;

export async function syncReviewSource(
  source: ReviewSource,
  options: {
    /** Cap on how many new rows to insert this run. Free workspaces
     *  pass `maxTestimonials - currentTestimonialCount` so imports
     *  never blow past the plan's ceiling. Undefined = unlimited
     *  (Pro workspaces). */
    maxToImport?: number;
    /** Overrides source.autoApprove for this sync only. Free plans
     *  force PENDING regardless of the source setting so users curate
     *  before anything lands on their wall. */
    forcePending?: boolean;
  } = {},
): Promise<SyncResult> {
  const adapter = ADAPTERS[source.platform];
  if (!adapter || !adapter.available()) {
    const err = `Adapter for ${source.platform} is not configured on the server.`;
    await prisma.reviewSource.update({
      where: { id: source.id },
      data: {
        syncStatus: "ERROR",
        syncError: err,
        lastSyncedAt: new Date(),
      },
    });
    return { imported: 0, skipped: 0, error: err };
  }

  let reviews;
  try {
    reviews = await adapter.fetchReviews(source.externalAppId);
  } catch (err) {
    const message = (err as Error).message ?? "Unknown sync failure";
    await prisma.reviewSource.update({
      where: { id: source.id },
      data: {
        syncStatus: "ERROR",
        syncError: message.slice(0, 500),
        lastSyncedAt: new Date(),
      },
    });
    return { imported: 0, skipped: 0, error: message };
  }

  if (reviews.length === 0) {
    await prisma.reviewSource.update({
      where: { id: source.id },
      data: {
        syncStatus: "ACTIVE",
        syncError: null,
        lastSyncedAt: new Date(),
      },
    });
    return { imported: 0, skipped: 0 };
  }

  // Dedup — pull existing externalReviewIds for this workspace so
  // we don't insert the same review twice. One query is cheaper
  // than N unique constraints.
  const existing = await prisma.testimonial.findMany({
    where: {
      workspaceId: source.workspaceId,
      externalReviewId: {
        in: reviews.map((r) => r.externalId),
      },
    },
    select: { externalReviewId: true },
  });
  const seen = new Set(existing.map((e) => e.externalReviewId));

  // Filter by min-rating threshold set on the source.
  const eligibleAll = reviews.filter(
    (r) => !seen.has(r.externalId) && r.rating >= source.minRating,
  );

  // Cap on how many rows we're allowed to insert this run (Free
  // plans pass remaining-slots-until-max-testimonials). If the cap
  // is zero or negative, we bail early with a capReached flag so
  // the API can surface an upgrade nudge.
  const cap = options.maxToImport;
  const eligible =
    typeof cap === "number" && cap >= 0
      ? eligibleAll.slice(0, cap)
      : eligibleAll;
  const capReached =
    typeof cap === "number" && eligibleAll.length > eligible.length;

  if (eligible.length === 0) {
    await prisma.reviewSource.update({
      where: { id: source.id },
      data: {
        syncStatus: "ACTIVE",
        syncError: null,
        lastSyncedAt: new Date(),
      },
    });
    return {
      imported: 0,
      skipped: reviews.length,
      ...(capReached ? { capReached } : {}),
    };
  }

  // Bulk insert — createMany doesn't return rows, which is fine here.
  const testimonialSource = PLATFORM_TO_TESTIMONIAL_SOURCE[source.platform];
  const shouldAutoApprove = source.autoApprove && !options.forcePending;
  await prisma.testimonial.createMany({
    data: eligible.map((r) => ({
      workspaceId: source.workspaceId,
      customerName: r.authorName,
      customerTitle: r.authorHandle ?? undefined,
      content: r.content,
      rating: r.rating,
      source: testimonialSource,
      sourceUrl: r.sourceUrl,
      status: shouldAutoApprove ? "APPROVED" : "PENDING",
      externalReviewId: r.externalId,
      reviewSourceId: source.id,
      createdAt: r.postedAt,
    })),
    skipDuplicates: true,
  });

  await prisma.reviewSource.update({
    where: { id: source.id },
    data: {
      syncStatus: "ACTIVE",
      syncError: null,
      lastSyncedAt: new Date(),
      totalImported: { increment: eligible.length },
    },
  });

  return {
    imported: eligible.length,
    skipped: reviews.length - eligible.length,
    ...(capReached ? { capReached } : {}),
  };
}
