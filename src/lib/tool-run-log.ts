import { prisma } from "@/lib/prisma";

/**
 * One row per Find my praise / Customer Voice run, so we can see how often
 * each provider is used, whether Claude ran, and how many quotes came back.
 * Holds no IP address, email or user id; the host is the business site that
 * was searched. Logging must never break a scan, so every failure is swallowed.
 */
export type ToolRunLog = {
  tool: "find-proof" | "customer-voice";
  host: string;
  tier: string;
  outcome: "found" | "empty" | "cached" | "error";
  provider: string;
  snippets?: number;
  reviewSite?: number;
  quotes?: number;
  dropped?: number;
  claudeUsed?: boolean;
  ms?: number;
};

export async function logToolRun(run: ToolRunLog): Promise<void> {
  try {
    await prisma.toolRun.create({
      data: {
        tool: run.tool,
        host: run.host.slice(0, 120),
        tier: run.tier,
        outcome: run.outcome,
        provider: run.provider,
        snippets: run.snippets ?? 0,
        reviewSite: run.reviewSite ?? 0,
        quotes: run.quotes ?? 0,
        dropped: run.dropped ?? 0,
        claudeUsed: run.claudeUsed ?? false,
        ms: Math.max(0, Math.round(run.ms ?? 0)),
      },
    });
  } catch (err) {
    console.warn("[tool-run-log] could not save run:", err);
  }
}
