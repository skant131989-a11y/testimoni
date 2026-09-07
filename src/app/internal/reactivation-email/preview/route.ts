import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reactivationEmailHtml } from "@/lib/emails/reactivation";
import { safeDisplayName, safeWorkspaceName } from "@/lib/name-utils";

/**
 * Renders the reactivation email for a real user, looked up by email.
 * Same pattern as the welcome-email preview route — DB lookup with a
 * synthetic fallback so the page never blanks out.
 *
 * If ?email=... is missing / unmatched, falls back to a sample "Alex"
 * render. Query flag ?json=1 returns a compact JSON with a "meta"
 * object describing the source (DB vs fallback) — used by the
 * preview UI.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const wantsJson = url.searchParams.get("json") === "1";
  const origin = "https://testimoni.io";

  let payload: {
    name: string;
    email: string;
    workspaceName: string;
    workspaceSlug: string;
    widgetId: string;
    formSlug: string;
    source: "db" | "fallback";
    error?: string;
  };

  if (!email) {
    payload = {
      name: "Alex",
      email: "alex@example.com",
      workspaceName: "Alex's Workspace",
      workspaceSlug: "sample-workspace",
      widgetId: "demo",
      formSlug: "feedback",
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
                forms: {
                  orderBy: { createdAt: "asc" },
                  take: 1,
                  select: { slug: true },
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
        workspaceSlug: "sample-workspace",
        widgetId: "demo",
        formSlug: "feedback",
        source: "fallback",
        error: `No user or workspace found for ${email}`,
      };
    } else {
      const displayName = safeDisplayName(user.name, user.email);
      const workspaceName = safeWorkspaceName(workspace.name, displayName);
      payload = {
        name: displayName,
        email: user.email,
        workspaceName,
        workspaceSlug: workspace.slug,
        widgetId: workspace.widgets[0]?.id ?? "demo",
        formSlug: workspace.forms[0]?.slug ?? "feedback",
        source: "db",
      };
    }
  }

  const html = reactivationEmailHtml({
    name: payload.name,
    workspaceName: payload.workspaceName,
    wallUrl: `${origin}/w/${payload.widgetId}`,
    importUrl: `${origin}/dashboard/import`,
    collectFormUrl: `${origin}/collect/${payload.workspaceSlug}/${payload.formSlug}`,
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
        workspaceSlug: payload.workspaceSlug,
        widgetId: payload.widgetId,
        formSlug: payload.formSlug,
      },
    });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
