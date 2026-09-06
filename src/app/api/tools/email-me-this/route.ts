import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/emails/send";
import {
  toolDeliveryEmailHtml,
  toolDeliveryEmailSubject,
  type ToolDeliveryTool,
} from "@/lib/emails/tool-delivery";

/**
 * POST /api/tools/email-me-this
 *
 * Public endpoint — no auth. A visitor on a free tool asks to have
 * their output emailed to them. We fire a delivery email (immediate,
 * fire-and-forget) with the file/text they made + a soft signup CTA.
 *
 * MVP scope:
 * - No DB storage — captures land in Resend logs + PostHog analytics
 * - No nurture drip — one email, done. Add later if capture rates justify.
 *
 * Rate limit: none in this pass. If we see abuse we'll add a simple
 * in-memory per-IP throttle.
 */

const VALID_TOOLS: ToolDeliveryTool[] = [
  "testimonial-card",
  "testimonial-writer",
  "ask-templates",
  "linkedin-recommendation",
  "star-badge",
];

interface Body {
  email?: string;
  tool?: ToolDeliveryTool;
  content?: string;
  backLink?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim().slice(0, 200);
  const tool = body.tool;
  const content = (body.content || "").trim().slice(0, 20_000);
  const backLink = (body.backLink || "").trim().slice(0, 500) || undefined;

  // Very light validation — full email format is hard to get right;
  // we just check for an @ + a . after the @. Resend will reject
  // malformed addresses anyway.
  if (!email || !email.includes("@") || !email.split("@")[1]?.includes(".")) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  if (!tool || !VALID_TOOLS.includes(tool)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "Missing content to deliver" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
  const signupUrl = `${appUrl}/signup?tool=${tool}&via=email_me_this`;

  const html = toolDeliveryEmailHtml({
    tool,
    content,
    backLink,
    signupUrl,
  });

  // Fire-and-forget with a real await so we can surface errors if the
  // send itself failed synchronously — but the wrapped sendEmail
  // already returns { ok, error } instead of throwing.
  const res = await sendEmail({
    to: email,
    // Delivery emails come from hello@ (replyable, warm) so users can
    // reply directly if they hit trouble.
    from: "Testimoni <hello@testimoni.io>",
    subject: toolDeliveryEmailSubject(tool),
    html,
  });

  if (!res.ok) {
    return NextResponse.json(
      {
        error:
          res.error === "no_api_key"
            ? "Email service not configured yet."
            : "Could not send the email. Try again.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ sent: true }, { status: 200 });
}
