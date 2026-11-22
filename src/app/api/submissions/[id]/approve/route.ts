import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { approveSubmission } from "@/lib/approve-submission";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const result = await approveSubmission({
    workspaceId: auth.workspace.id,
    workspaceSlug: auth.workspace.slug,
    submissionId: id,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, testimonialId: result.testimonialId, widget: result.widget });
}
