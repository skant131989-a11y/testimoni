import { prisma } from "@/lib/prisma";

/**
 * Founder directory data — shared query layer used by:
 *   - /founders (directory listing)
 *   - /founders/[slug] (individual profile)
 *   - /wall (Wall of Walls — top testimonials across all workspaces)
 *   - / (Testimonial of the Day rotation)
 *   - /api/badges/trending/[slug] (Trending badge SVG)
 *
 * A workspace only appears anywhere public when publicListing = true.
 * Owners toggle it in Settings; nothing goes public without consent.
 */

// Shape returned by listFounderDirectory + friends. Kept intentionally
// small — no owner emails, no internal ids beyond slug, no counts we
// wouldn't want to advertise.
export interface FounderDirectoryEntry {
  slug: string;
  name: string;
  logoUrl: string | null;
  pitch: string | null;
  websiteUrl: string | null;
  xHandle: string | null;
  approvedCount: number;
  latestCreatedAt: Date | null;
  wallUrl: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

/**
 * List every workspace opted into the public directory, with
 * activity stats used for the sort + trending views. Uses two
 * grouped queries + a single findMany so we don't N+1 across
 * every workspace.
 */
export async function listFounderDirectory(opts?: {
  sort?: "trending" | "newest" | "most";
  limit?: number;
}): Promise<FounderDirectoryEntry[]> {
  const sort = opts?.sort ?? "trending";
  const limit = opts?.limit ?? 100;

  const workspaces = await prisma.workspace.findMany({
    where: { publicListing: true },
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      pitch: true,
      websiteUrl: true,
      xHandle: true,
      widgets: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (workspaces.length === 0) return [];
  const wsIds = workspaces.map((w) => w.id);

  // Approved-testimonial counts per workspace.
  const counts = await prisma.testimonial.groupBy({
    by: ["workspaceId"],
    where: { workspaceId: { in: wsIds }, status: "APPROVED" },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  const countByWs = new Map<string, number>();
  const latestByWs = new Map<string, Date | null>();
  for (const c of counts) {
    countByWs.set(c.workspaceId, c._count._all);
    latestByWs.set(c.workspaceId, c._max.createdAt);
  }

  const entries: FounderDirectoryEntry[] = workspaces.map((w) => ({
    slug: w.slug,
    name: w.name,
    logoUrl: w.logoUrl,
    pitch: w.pitch,
    websiteUrl: w.websiteUrl,
    xHandle: w.xHandle,
    approvedCount: countByWs.get(w.id) ?? 0,
    latestCreatedAt: latestByWs.get(w.id) ?? null,
    // Prefer the workspace's active widget id (canonical wall URL);
    // fall back to /w/demo shape only if they have no widget yet.
    wallUrl: w.widgets[0]?.id
      ? `${SITE_URL}/w/${w.widgets[0].id}`
      : `${SITE_URL}/w/${w.slug}`,
  }));

  // Sort strategies. Trending = testimonials added in the last 7 days
  // as a proxy for momentum; newest = latest testimonial recency;
  // most = raw approved count.
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  entries.sort((a, b) => {
    if (sort === "most") return b.approvedCount - a.approvedCount;
    if (sort === "newest") {
      return (
        (b.latestCreatedAt?.getTime() ?? 0) -
        (a.latestCreatedAt?.getTime() ?? 0)
      );
    }
    // trending — score = approved count, with a big bonus for
    // workspaces with recent activity (last 7 days).
    const aRecent = a.latestCreatedAt && now - a.latestCreatedAt.getTime() < SEVEN_DAYS ? 5 : 0;
    const bRecent = b.latestCreatedAt && now - b.latestCreatedAt.getTime() < SEVEN_DAYS ? 5 : 0;
    return b.approvedCount + bRecent - (a.approvedCount + aRecent);
  });

  return entries.slice(0, limit);
}

/**
 * Fetch one workspace's public profile — same shape as directory
 * entries, plus a preview slice of the testimonials on their wall
 * so the profile page can render without hitting another endpoint.
 */
export async function getFounderProfile(slug: string) {
  const ws = await prisma.workspace.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      pitch: true,
      websiteUrl: true,
      xHandle: true,
      publicListing: true,
      widgets: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!ws || !ws.publicListing) return null;

  const [approvedCount, latest, top] = await Promise.all([
    prisma.testimonial.count({
      where: { workspaceId: ws.id, status: "APPROVED" },
    }),
    prisma.testimonial.findFirst({
      where: { workspaceId: ws.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.testimonial.findMany({
      where: { workspaceId: ws.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        content: true,
        customerName: true,
        customerAvatar: true,
        customerTitle: true,
        rating: true,
        source: true,
        sourceUrl: true,
        videoUrl: true,
      },
    }),
  ]);

  return {
    slug: ws.slug,
    name: ws.name,
    logoUrl: ws.logoUrl,
    pitch: ws.pitch,
    websiteUrl: ws.websiteUrl,
    xHandle: ws.xHandle,
    approvedCount,
    latestCreatedAt: latest?.createdAt ?? null,
    wallUrl: ws.widgets[0]?.id
      ? `${SITE_URL}/w/${ws.widgets[0].id}`
      : `${SITE_URL}/w/${ws.slug}`,
    testimonials: top,
  };
}

/**
 * Top-N approved testimonials across every publicly listed workspace,
 * ranked so the newest recent-and-not-empty picks bubble up. Backs
 * the Wall of Walls (/wall) + the Testimonial of the Day rotation.
 * The `dailyRotationKey` returns a deterministic index into the pool
 * so the daily pick is stable within a UTC day.
 */
export async function listTopTestimonialsAcrossWorkspaces(
  opts?: { limit?: number }
) {
  const limit = opts?.limit ?? 60;
  return prisma.testimonial.findMany({
    where: {
      status: "APPROVED",
      content: { not: null },
      workspace: { publicListing: true },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      content: true,
      customerName: true,
      customerAvatar: true,
      customerTitle: true,
      rating: true,
      source: true,
      sourceUrl: true,
      workspace: {
        select: {
          slug: true,
          name: true,
          logoUrl: true,
          widgets: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });
}

/**
 * Deterministic-per-day pick from a pool. Same UTC day → same index →
 * same testimonial. Used for the "Testimonial of the day" rotation.
 */
export function dailyRotationIndex(poolSize: number): number {
  if (poolSize <= 0) return 0;
  // Days since the Unix epoch as a stable seed.
  const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return day % poolSize;
}
