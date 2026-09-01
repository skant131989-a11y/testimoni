import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { welcomeEmailHtml } from "@/lib/emails/welcome";

/**
 * Renders the welcome email for a real user, looked up by email.
 * All URLs + names populated from the DB, no manual field entry.
 *
 * If ?email=... is missing or unmatched, falls back to a synthetic
 * "sample" render so the page never blanks out. Query flag ?json=1
 * flips the response to a compact JSON with a "meta" object describing
 * whether the render came from real data or the fallback — used by
 * the preview UI to show the source.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const wantsJson = url.searchParams.get("json") === "1";
  // Emails ALWAYS point at production, regardless of dev / staging
  // env vars. A recipient shouldn't ever see http://localhost or a
  // staging URL — those break the moment we tunnel from localhost or
  // the staging box goes down.
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
      // Prefer the name we have; fall back to the local-part of the
      // email so the greeting still reads like a real greeting.
      const name = user.name || email.split("@")[0];
      payload = {
        name,
        email: user.email,
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
        widgetId: workspace.widgets[0]?.id ?? "demo",
        formSlug: workspace.forms[0]?.slug ?? "feedback",
        source: "db",
      };
    }
  }

  const html = welcomeEmailHtml({
    name: payload.name,
    email: payload.email,
    workspaceName: payload.workspaceName,
    wallUrl: `${origin}/w/${payload.widgetId}`,
    dashboardUrl: `${origin}/dashboard`,
    importUrl: `${origin}/dashboard/import`,
    collectFormUrl: `${origin}/collect/${payload.workspaceSlug}/${payload.formSlug}`,
    embedPageUrl: `${origin}/dashboard/widgets/${payload.widgetId}/embed`,
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
