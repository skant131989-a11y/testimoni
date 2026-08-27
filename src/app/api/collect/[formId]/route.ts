import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;

  const form = await prisma.collectionForm.findUnique({
    where: { id: formId },
    select: {
      id: true,
      headline: true,
      description: true,
      allowRating: true,
      thankYouMessage: true,
      isActive: true,
      workspace: {
        select: { name: true },
      },
    },
  });

  if (!form || !form.isActive) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const response = NextResponse.json({
    headline: form.headline,
    description: form.description,
    allowRating: form.allowRating,
    thankYouMessage: form.thankYouMessage,
    workspace: { name: form.workspace.name },
  });

  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );
  response.headers.set("Access-Control-Allow-Origin", "*");

  return response;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
