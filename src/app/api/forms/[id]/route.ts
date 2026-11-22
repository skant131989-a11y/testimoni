import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

/**
 * PATCH /api/forms/[id]
 *
 * Lets an owner customize what people see on their collection form: the
 * headline, the intro line, the thank-you message, and an optional gift
 * (a discount code or link) shown after someone submits.
 */
const BODY = z.object({
  headline: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  thankYouMessage: z.string().trim().min(1).max(300).optional(),
  thankYouReward: z.string().trim().max(240).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Check the fields: the headline and thank-you message can't be empty." }, { status: 400 });
  }

  const { id } = await params;
  const form = await prisma.collectionForm.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!form || form.workspaceId !== auth.workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, string | null> = {};
  if (body.headline !== undefined) data.headline = body.headline;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.thankYouMessage !== undefined) data.thankYouMessage = body.thankYouMessage;
  if (body.thankYouReward !== undefined) data.thankYouReward = body.thankYouReward || null;

  const updated = await prisma.collectionForm.update({
    where: { id },
    data,
    select: { id: true, headline: true, description: true, thankYouMessage: true, thankYouReward: true },
  });
  return NextResponse.json({ form: updated });
}
