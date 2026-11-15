import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Saved Find my praise results (FindProofCache), shared by every
 * visitor and account. A repeat scan of the same website reads from
 * here instead of calling Tavily and Groq/Claude again, and does not
 * count toward anyone's allowance.
 *
 * Two tiers are kept apart: the standard scan (visitors and free
 * accounts) and the deeper Pro scan. Praise changes slowly, so standard
 * results are kept for a week; Pro results for a day so a paid rescan
 * can pick up new posts. Empty results expire sooner, in case the
 * search simply missed.
 */

export type CacheTier = "basic" | "pro";

const HOUR = 60 * 60 * 1000;
const TTL_MS: Record<CacheTier, { found: number; empty: number }> = {
  basic: { found: 7 * 24 * HOUR, empty: 24 * HOUR },
  pro: { found: 24 * HOUR, empty: 6 * HOUR },
};

const keyFor = (normalizedUrl: string, tier: CacheTier) => `${normalizedUrl}|${tier}`;

export async function getCachedScan<T extends { topQuotes?: unknown[] }>(
  normalizedUrl: string,
  tier: CacheTier
): Promise<T | null> {
  try {
    const row = await prisma.findProofCache.findUnique({
      where: { key: keyFor(normalizedUrl, tier) },
    });
    if (!row) return null;
    const result = row.result as unknown as T;
    const found = Array.isArray(result.topQuotes) && result.topQuotes.length > 0;
    const ttl = found ? TTL_MS[tier].found : TTL_MS[tier].empty;
    if (Date.now() - row.createdAt.getTime() > ttl) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * Customer Voice keeps its own saved scan per website (UrlScan). When one
 * exists, its praise and testimonials answer Find my praise for the same
 * site with no search at all.
 */
export async function getSharedScanQuotes(normalizedUrl: string) {
  try {
    const row = await prisma.urlScan.findUnique({ where: { normalizedUrl } });
    if (!row || Date.now() - row.refreshedAt.getTime() > 7 * 24 * HOUR) return null;
    const r = row.resultJson as unknown as {
      brand?: string;
      mentions?: Array<{
        content: string;
        author: string;
        role?: string;
        source: string;
        sourceUrl?: string;
        categories?: string[];
        score?: number;
      }>;
    };
    const topQuotes = (r.mentions ?? [])
      .filter((m) => m.categories?.includes("praise") || m.categories?.includes("testimonial"))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10)
      .map((m) => ({
        content: m.content,
        author: m.author,
        role: m.role,
        source: m.source,
        sourceUrl: m.sourceUrl,
        score: Math.max(1, Math.min(100, Math.round(m.score ?? 60))),
      }));
    if (topQuotes.length === 0) return null;
    const byPlatform = new Map<string, number>();
    for (const q of topQuotes) byPlatform.set(q.source, (byPlatform.get(q.source) ?? 0) + 1);
    return {
      brand: r.brand || row.brand,
      totalMentions: topQuotes.length,
      platforms: [...byPlatform.entries()].map(([name, count]) => ({ name, count })),
      topQuotes,
      provider: "shared-scan",
    };
  } catch {
    return null;
  }
}

export async function saveCachedScan(
  normalizedUrl: string,
  tier: CacheTier,
  result: unknown
): Promise<void> {
  try {
    const key = keyFor(normalizedUrl, tier);
    const value = result as Prisma.InputJsonValue;
    await prisma.findProofCache.upsert({
      where: { key },
      create: { key, result: value },
      update: { result: value, createdAt: new Date() },
    });
  } catch (err) {
    console.warn("[find-proof-cache] save failed:", err);
  }
}
