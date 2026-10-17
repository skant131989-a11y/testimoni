import { prisma } from "@/lib/prisma";
import { runUrlScan } from "@/lib/url-scan";
import type { ScanResult } from "@/lib/scan-report";

/**
 * Background scan of a workspace's OWN product for public praise.
 * Hard-wired to `allowClaude: false`: only Tavily + Groq are used —
 * this code path never calls the Anthropic API.
 */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const MIN_PRAISE_TO_NOTIFY = 3;

function praiseCountOf(result: ScanResult): number {
  return result.mentions.filter((m) =>
    m.categories.some((c) => c === "praise" || c === "testimonial" || c === "outcome")
  ).length;
}

export async function scanWorkspaceProduct(
  workspaceId: string
): Promise<{ scanId: string; praiseCount: number; totalMentions: number } | null> {
  const row = await prisma.workspaceMentionScan.findUnique({
    where: { workspaceId },
    include: { workspace: { select: { xHandle: true } } },
  });
  if (!row) return null;

  let scanId: string;
  let result: ScanResult;

  // A fresh cached scan of the same URL (e.g. someone ran it on the
  // public tool) is reused — no Tavily/Groq spend.
  const cached = await prisma.urlScan.findUnique({ where: { normalizedUrl: row.normalizedUrl } });
  if (cached && Date.now() - cached.refreshedAt.getTime() < CACHE_TTL_MS) {
    scanId = cached.id;
    result = cached.resultJson as unknown as ScanResult;
  } else {
    const handle = row.workspace.xHandle?.replace(/^@/, "").trim();
    const out = await runUrlScan(row.normalizedUrl, {
      twitterHandles: handle ? [handle] : [],
      allowClaude: false,
    });
    if (!out) {
      // Settle the state so the dashboard stops showing "scanning".
      await prisma.workspaceMentionScan.update({
        where: { workspaceId },
        data: { scannedAt: new Date(), praiseCount: 0, totalMentions: 0 },
      });
      return null;
    }
    scanId = out.id;
    result = out.result;
  }

  const praiseCount = praiseCountOf(result);
  await prisma.workspaceMentionScan.update({
    where: { workspaceId },
    data: { scanId, praiseCount, totalMentions: result.totalMentions, scannedAt: new Date() },
  });
  return { scanId, praiseCount, totalMentions: result.totalMentions };
}
