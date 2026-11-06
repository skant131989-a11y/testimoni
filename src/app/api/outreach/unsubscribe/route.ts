import { prisma } from "@/lib/prisma";
import { verifyOutreachUnsubscribeToken } from "@/lib/leads/outreach-unsubscribe";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function page(title: string, message: string, email?: string, token?: string) {
  const form = email && token
    ? `<form method="post" action="/api/outreach/unsubscribe"><input type="hidden" name="email" value="${escapeHtml(email)}"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit" style="background:#5b21b6;color:white;border:0;border-radius:8px;padding:12px 18px;font-weight:700;cursor:pointer">Unsubscribe</button></form>`
    : "";
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)} · Testimoni</title><body style="font:16px/1.6 system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:24px;color:#1f2937"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>${form}<p style="margin-top:28px;color:#6b7280">Testimoni · hello@testimoni.io</p></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function validInput(email: string, token: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && verifyOutreachUnsubscribeToken(email, token);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const token = url.searchParams.get("token") || "";
  if (!validInput(email, token)) return page("Link expired", "This unsubscribe link is invalid or has expired. Reply to the email with “stop” and we’ll take care of it.");
  return page("Manage email preferences", `Confirm that you no longer want to receive product emails at ${email}.`, email, token);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const token = String(form.get("token") || "");
  if (!validInput(email, token)) return page("Link expired", "This unsubscribe link is invalid or has expired. Reply to the email with “stop” and we’ll take care of it.");

  await prisma.outreachSuppression.upsert({
    where: { email },
    create: { email, reason: "One-click unsubscribe from outreach email" },
    update: { reason: "One-click unsubscribe from outreach email" },
  });
  return page("You’re unsubscribed", `We won’t send further prospecting emails to ${email}.`);
}

