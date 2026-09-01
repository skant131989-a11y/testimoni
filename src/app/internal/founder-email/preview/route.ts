import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { founderEmailHtml } from "@/lib/emails/founder-checkin";

/**
 * Same lookup-by-email pattern as the welcome preview: enter an email,
 * we look up the user + workspace + first widget, render the founder
 * check-in for their account. Falls back to a "sample" render if no
 * email or no match so the page never blanks out.
 *
 * ?json=1 returns the meta + html for the preview UI's data-source
 * badge; without it, returns pure HTML for the iframe.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const founderName =
    url.searchParams.get("founderName")?.trim() || "Neha Singh";
  const founderEmail =
    url.searchParams.get("founderEmail")?.trim() || "neha@testimoni.io";
  const wantsJson = url.searchParams.get("json") === "1";
  // Emails ALWAYS use production URLs, regardless of NEXT_PUBLIC_APP_URL
  // — recipients should never see http://localhost or a staging URL.
  const origin = "https://testimoni.io";

  let payload: {
    name: string;
    email: string;
    workspaceName: string;
    widgetId: string;
    source: "db" | "fallback";
    error?: string;
  };

  if (!email) {
    payload = {
      name: "Alex",
      email: "alex@example.com",
      workspaceName: "Alex's Workspace",
      widgetId: "demo",
      source: "fallback",
    };
  } else {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaceMembers: {
          include: {
            workspace: {
              include: {
                widgets: {
                  orderBy: { createdAt: "asc" },
                  take: 1,
                  select: { id: true },
                },
              },
            },
          },
          take: 1,
        },
      },
    });
    const workspace = user?.workspaceMembers[0]?.workspace;
    if (!user || !workspace) {
      payload = {
        name: "Alex",
        email,
        workspaceName: "Alex's Workspace",
        widgetId: "demo",
        source: "fallback",
        error: `No user or workspace found for ${email}`,
      };
    } else {
      // Prefer first name only for warmth — "Hi Priya" reads better
      // than "Hi Priya Menon" in a personal note.
      const rawName = user.name || email.split("@")[0];
      const firstName = rawName.split(" ")[0];
      payload = {
        name: firstName,
        email: user.email,
        workspaceName: workspace.name,
        widgetId: workspace.widgets[0]?.id ?? "demo",
        source: "db",
      };
    }
  }

  const html = founderEmailHtml({
    name: payload.name,
    email: payload.email,
    workspaceName: payload.workspaceName,
    wallUrl: `${origin}/w/${payload.widgetId}`,
    founderName,
    founderEmail,
  });

  if (wantsJson) {
    return NextResponse.json({
      html,
      meta: {
        source: payload.source,
        error: payload.error ?? null,
        recipient: {
          name: payload.name,
          email: payload.email,
        },
        workspaceName: payload.workspaceName,
        widgetId: payload.widgetId,
        founderName,
        founderEmail,
      },
    });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
