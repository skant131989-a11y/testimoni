import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { form: { select: { workspaceId: true } } },
  });

  if (!submission || submission.form.workspaceId !== auth.workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.submission.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  return NextResponse.json({ ok: true });
}
