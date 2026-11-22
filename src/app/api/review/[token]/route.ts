import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyReviewToken } from "@/lib/review-token";
import { approveSubmission } from "@/lib/approve-submission";

/**
 * POST /api/review/[token]  { action: "approve" | "reject" }
 *
 * Acts on the one submission the signed email link names, without a login.
 * Opening the link never does this: only the button on the review page does.
 */
const BODY = z.object({ action: z.enum(["approve", "reject"]) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const verified = verifyReviewToken(token);
  if (!verified) return NextResponse.json({ error: "This link has expired. Open your inbox instead." }, { status: 401 });

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const sub = await prisma.submission.findUnique({
    where: { id: verified.submissionId },
    select: { status: true, form: { select: { workspace: { select: { id: true, slug: true } } } } },
  });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.status !== "NEW") return NextResponse.json({ error: "Already handled", status: sub.status }, { status: 409 });

  if (body.action === "reject") {
    await prisma.submission.update({ where: { id: verified.submissionId }, data: { status: "REJECTED" } });
    return NextResponse.json({ ok: true, action: "rejected" });
  }

  const ws = sub.form.workspace;
  const result = await approveSubmission({ workspaceId: ws.id, workspaceSlug: ws.slug, submissionId: verified.submissionId });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, action: "approved", wallId: result.widget?.id ?? null });
}
