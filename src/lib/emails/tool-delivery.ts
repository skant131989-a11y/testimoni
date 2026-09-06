/**
 * Delivery email for the "Email me this" flow on public tools.
 *
 * Single template used across all tools — subject and body adapt
 * to the sourceTool so the same helper can serve card generator,
 * writer, ask templates, LinkedIn recommendation, and star badge.
 *
 * Design: plain-note style. No hero images. Signup CTA soft — the
 * primary job is to deliver the file/text they asked for. Sneaking
 * in an aggressive upsell would burn the trust the tool built.
 */

export type ToolDeliveryTool =
  | "testimonial-card"
  | "testimonial-writer"
  | "ask-templates"
  | "linkedin-recommendation"
  | "star-badge";

export interface ToolDeliveryEmailData {
  tool: ToolDeliveryTool;
  /** Human-readable output the user made — a testimonial, a card
   *  URL, an ask template. Shown verbatim in the email. */
  content: string;
  /** Optional back-link so the user can jump back into the tool
   *  and iterate on the same output. */
  backLink?: string;
  /** Signup URL — utm-tagged so nurture conversions attribute. */
  signupUrl: string;
}

const TOOL_LABELS: Record<ToolDeliveryTool, { subject: string; opener: string; unlock: string }> = {
  "testimonial-card": {
    subject: "Your testimonial card is ready",
    opener: "Here's the testimonial card you designed:",
    unlock: "Sign up to remove the watermark, unlock 2 Pro themes, and save every card to your Wall of Love.",
  },
  "testimonial-writer": {
    subject: "Your 3 testimonial versions are ready",
    opener: "Here are the three testimonial versions you generated:",
    unlock: "Sign up to save all your generated testimonials, regenerate variations unlimited times, and drop them onto a live wall.",
  },
  "ask-templates": {
    subject: "Your customer-ask templates",
    opener: "Here are the templates you generated for asking customers for testimonials:",
    unlock: "Sign up to save your templates, generate new ones anytime, and hook them into a real form URL that collects responses in your inbox.",
  },
  "linkedin-recommendation": {
    subject: "Your LinkedIn recommendation is ready",
    opener: "Here are the LinkedIn recommendation versions you generated:",
    unlock: "Sign up to save every recommendation you write, edit them later, and turn them into a live testimonials wall.",
  },
  "star-badge": {
    subject: "Your star rating badge",
    opener: "Here's the star badge you designed:",
    unlock: "Sign up to remove the 'testimoni.io' text and connect the badge to live testimonial data — auto-updates as new reviews come in.",
  },
};

export function toolDeliveryEmailSubject(tool: ToolDeliveryTool): string {
  return TOOL_LABELS[tool].subject;
}

export function toolDeliveryEmailHtml(data: ToolDeliveryEmailData): string {
  const { tool, content, backLink, signupUrl } = data;
  const { opener, unlock } = TOOL_LABELS[tool];

  const backLinkRow = backLink
    ? `<p style="margin:0 0 20px 0;font-size:13px;color:#6b7280;">
        <a href="${escapeAttr(backLink)}" style="color:#7c3aed;text-decoration:underline;">Open it again in the tool &rarr;</a>
      </p>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(TOOL_LABELS[tool].subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="font-size:15px;line-height:1.65;color:#1f2937;">
              <p style="margin:0 0 16px 0;">Hi,</p>
              <p style="margin:0 0 12px 0;">${escapeHtml(opener)}</p>

              <div style="margin:12px 0 20px 0;padding:14px 16px;border-left:3px solid #7c3aed;background-color:#faf7ff;color:#1f2937;white-space:pre-wrap;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;">${escapeHtml(content)}</div>

              ${backLinkRow}

              <p style="margin:0 0 12px 0;color:#4b5563;font-size:14px;">${escapeHtml(unlock)}</p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="background-color:#5b21b6;border-radius:8px;">
                    <a href="${escapeAttr(signupUrl)}" target="_blank" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Start free &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 4px 0;">— Shashi</p>
              <p style="margin:0;color:#6b7280;font-size:13px;">
                Testimoni &middot; <a href="mailto:hello@testimoni.io" style="color:#6b7280;text-decoration:underline;">hello@testimoni.io</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
