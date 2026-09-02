import { NextResponse } from "next/server";
import {
  pitchEmailHtml,
  pitchEmailSubject,
  type PitchAudience,
} from "@/lib/emails/pitch";

/**
 * Renders the outreach pitch email HTML. Same pattern as
 * welcome-email and founder-email preview routes — feed it query
 * params, get back HTML for the iframe (or JSON with meta if ?json=1).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams;
  const wantsJson = q.get("json") === "1";

  const audience = (q.get("audience") || "founder") as PitchAudience;
  const recipientName = q.get("recipientName") || "Alex";
  const companyName = q.get("companyName") || undefined;
  const praiseTweetUrl = q.get("praiseTweetUrl") || undefined;
  const senderName = q.get("senderName") || "Neha Singh";
  const senderEmail = q.get("senderEmail") || "neha@testimoni.io";

  const html = pitchEmailHtml({
    audience,
    recipientName,
    companyName,
    praiseTweetUrl,
    senderName,
    senderEmail,
    landingUrl: "https://testimoni.io",
  });

  if (wantsJson) {
    return NextResponse.json({
      html,
      meta: {
        subject: pitchEmailSubject(audience, recipientName),
        senderName,
        senderEmail,
        recipientName,
        audience,
      },
    });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
