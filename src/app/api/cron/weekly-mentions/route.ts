import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scanWorkspaceProduct, MIN_PRAISE_TO_NOTIFY } from "@/lib/workspace-scan";
import { sendEmail } from "@/lib/emails/send";
import {
  newMentionsHtml,
  newMentionsSubject,
  newMentionsText,
} from "@/lib/emails/new-mentions";
import type { ScanResult } from "@/lib/scan-report";

/**
 * GET /api/cron/weekly-mentions — Mondays ~9am Pacific (see vercel.json).
 *
 * Re-scans each workspace's own product (Tavily + Groq only — this
 * route never touches the Anthropic API) and emails the owner when
 * there is more public praise than they were last told about.
 *
 * SAFE BY DEFAULT: emails are only actually sent when
 * WEEKLY_MENTIONS_ENABLED=1. Otherwise (or with ?dryRun=1) it scans and
 * reports who WOULD be emailed. Scanning is the only cost.
 *
 * Time-boxed: each run handles the stalest workspaces it can finish
 * within the function limit; a second cron entry mops up the rest.
 */
const STALE_MS = 6 * 24 * 60 * 60 * 1000;
const BUDGET_MS = 24_000;
const BATCH = 3;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const sendReal =
    process.env.WEEKLY_MENTIONS_ENABLED === "1" && new URL(req.url).searchParams.get("dryRun") !== "1";

  const staleBefore = new Date(Date.now() - STALE_MS);
  const rows = await prisma.workspaceMentionScan.findMany({
    where: {
      normalizedUrl: { not: "" },
      OR: [{ scannedAt: null }, { scannedAt: { lt: staleBefore } }],
    },
    orderBy: { scannedAt: { sort: "asc", nulls: "first" } },
    take: 30,
    select: { workspaceId: true },
  });

  const suppressed = new Set(
    (await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email)
  );

  const report: Array<{ workspaceId: string; praiseCount?: number; action: string }> = [];

  for (let i = 0; i < rows.length; i += BATCH) {
    if (Date.now() - started > BUDGET_MS) break;
    const batch = rows.slice(i, i + BATCH);
    const outcomes = await Promise.all(
      batch.map(async ({ workspaceId }) => {
        try {
          const scan = await scanWorkspaceProduct(workspaceId);
          if (!scan) return { workspaceId, action: "no_result" };

          const state = await prisma.workspaceMentionScan.findUnique({ where: { workspaceId } });
          const hasNew = scan.praiseCount >= MIN_PRAISE_TO_NOTIFY && scan.praiseCount > (state?.emailedPraiseCount ?? 0);
          if (!hasNew) return { workspaceId, praiseCount: scan.praiseCount, action: "nothing_new" };

          const owner = await prisma.workspaceMember.findFirst({
            where: { workspaceId, role: "OWNER" },
            orderBy: { createdAt: "asc" },
            select: { user: { select: { email: true, name: true } } },
          });
          const email = owner?.user.email;
          if (!email || suppressed.has(email.toLowerCase())) {
            return { workspaceId, praiseCount: scan.praiseCount, action: "skipped_no_or_suppressed_email" };
          }
          if (!sendReal) return { workspaceId, praiseCount: scan.praiseCount, action: "would_email" };

          const cached = await prisma.urlScan.findUnique({ where: { id: scan.scanId } });
          const result = cached?.resultJson as unknown as ScanResult | undefined;
          const quotes = (result?.mentions ?? [])
            .filter((m) => m.categories.some((c) => c === "praise" || c === "testimonial" || c === "outcome"))
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .map((m) => ({ content: m.content, author: m.author, source: m.source }));

          const data = {
            name: owner?.user.name ?? null,
            website: state!.normalizedUrl.replace(/^https?:\/\//, ""),
            praiseCount: scan.praiseCount,
            scanId: scan.scanId,
            quotes,
          };
          const sent = await sendEmail({
            to: email,
            subject: newMentionsSubject(data.praiseCount, data.website),
            text: newMentionsText(data),
            html: newMentionsHtml(data),
            replyTo: "neha@testimoni.io",
            from: "Neha from Testimoni <neha@testimoni.io>",
          });
          if (sent.ok) {
            await prisma.workspaceMentionScan.update({
              where: { workspaceId },
              data: { emailedPraiseCount: scan.praiseCount, lastEmailedAt: new Date() },
            });
          }
          return { workspaceId, praiseCount: scan.praiseCount, action: sent.ok ? "emailed" : `send_failed:${sent.error}` };
        } catch (err) {
          console.error("[weekly-mentions] workspace failed:", workspaceId, err);
          return { workspaceId, action: "error" };
        }
      })
    );
    report.push(...outcomes);
  }

  return NextResponse.json({
    ok: true,
    sendReal,
    candidates: rows.length,
    processed: report.length,
    report,
  });
}
