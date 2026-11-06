import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function esc(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function page(title: string, message: string, token?: string) {
  const form = token
    ? `<form method="post" action="/api/requests/optout"><input type="hidden" name="token" value="${esc(token)}"><button type="submit" style="background:#5b21b6;color:white;border:0;border-radius:8px;padding:12px 18px;font-weight:700;cursor:pointer">Don't ask me again</button></form>`
    : "";
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title><body style="font:16px/1.6 system-ui,sans-serif;max-width:520px;margin:15vh auto;padding:24px;color:#1f2937"><h1>${esc(title)}</h1><p>${esc(message)}</p>${form}</body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow",
      },
    }
  );
}

// GET only shows a confirm button, so email scanners that open links
// can't opt anyone out by accident.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const row = token
    ? await prisma.testimonialRequest.findUnique({ where: { token }, select: { id: true } })
    : null;
  if (!row) return page("Link not valid", "This link is invalid or has expired.");
  return page("Stop testimonial requests?", "Confirm that you don't want to be asked for a testimonial again.", token);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const row = token
    ? await prisma.testimonialRequest.findUnique({ where: { token }, select: { workspaceId: true, email: true } })
    : null;
  if (!row) return page("Link not valid", "This link is invalid or has expired.");

  await prisma.testimonialRequest.updateMany({
    where: { workspaceId: row.workspaceId, email: row.email },
    data: { status: "UNSUBSCRIBED" },
  });
  return page("You're all set", "We won't ask you for a testimonial again.");
}
