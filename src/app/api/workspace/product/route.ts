import { NextResponse, after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { normalizeUrl } from "@/lib/url-scan";
import { scanWorkspaceProduct, MIN_PRAISE_TO_NOTIFY } from "@/lib/workspace-scan";
import { workDomainFromEmail } from "@/lib/email-domain";

/**
 * GET  /api/workspace/product — what the dashboard banner needs: do we
 *      know the product URL yet, is a scan running, how much praise did
 *      it find.
 * POST /api/workspace/product — { websiteUrl, xHandle? } saves the URL
 *      and starts a background scan (Tavily + Groq only, no Claude);
 *      { dismiss: true } closes the "what's your URL" prompt.
 */

export async function GET(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [ws, scan] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: auth.workspace.id },
      select: { websiteUrl: true },
    }),
    prisma.workspaceMentionScan.findUnique({ where: { workspaceId: auth.workspace.id } }),
  ]);

  const hasUrl = !!scan?.normalizedUrl;
  const scanned = !!scan?.scannedAt;
  return NextResponse.json({
    state: !hasUrl
      ? scan?.urlPromptDismissedAt
        ? "dismissed"
        : "needs_url"
      : scanned
        ? "ready"
        : "scanning",
    websiteUrl: ws?.websiteUrl ?? null,
    suggestedDomain: workDomainFromEmail(auth.user.email),
    praiseCount: scan?.praiseCount ?? 0,
    scanId: scan?.scanId ?? null,
    notify: scanned && (scan?.praiseCount ?? 0) >= MIN_PRAISE_TO_NOTIFY,
  });
}

const BODY = z.union([
  z.object({ dismiss: z.literal(true) }),
  z.object({
    websiteUrl: z.string().min(3).max(300),
    xHandle: z.string().max(60).optional(),
  }),
]);

export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const workspaceId = auth.workspace.id;

  if ("dismiss" in body) {
    await prisma.workspaceMentionScan.upsert({
      where: { workspaceId },
      create: { workspaceId, normalizedUrl: "", urlPromptDismissedAt: new Date() },
      update: { urlPromptDismissedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  const normalized = normalizeUrl(body.websiteUrl.trim());
  if (!normalized) {
    return NextResponse.json(
      { error: "That doesn't look like a valid website. Try something like acme.com" },
      { status: 400 }
    );
  }
  const xHandle = body.xHandle?.trim().replace(/^@/, "") || null;

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { websiteUrl: normalized, ...(xHandle ? { xHandle } : {}) },
  });
  await prisma.workspaceMentionScan.upsert({
    where: { workspaceId },
    create: { workspaceId, normalizedUrl: normalized },
    update: { normalizedUrl: normalized, scanId: null, praiseCount: 0, totalMentions: 0, scannedAt: null },
  });

  after(async () => {
    try {
      await scanWorkspaceProduct(workspaceId);
    } catch (err) {
      console.error("[workspace/product] background scan failed:", err);
    }
  });

  return NextResponse.json({ ok: true, state: "scanning" });
}
