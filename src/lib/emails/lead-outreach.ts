/**
 * HTML shell for Growth Engine outreach emails (/admin/leads →
 * "Send"). Same design system as pitch.ts — personal-note tone,
 * table layout + inline styles so Outlook doesn't strip it, 560px,
 * no imagery — but themed with Testimoni's violet CTA button and two
 * links instead of pitch.ts's one: signup as the primary ask, and a
 * smaller Customer Voice link so a not-ready-to-sign-up reader can
 * still see real proof (their own site's mentions) with zero
 * commitment, which is exactly what this email is telling them exists.
 *
 * The paragraph body itself comes from outreach.ts's grounded Claude
 * draft (or the admin's hand-edit of it in the preview) — this file
 * only wraps that already-personalized text in the branded shell.
 */

import { withUtm } from "./utm";

export interface LeadOutreachEmailData {
  /** Plain-text body, one or more paragraphs separated by blank
   *  lines — exactly what the admin saw/edited in the preview. */
  bodyText: string;
  senderName: string;
  senderEmail: string;
  /** The lead's own domain, used to pre-fill the Customer Voice link
   *  so it's a one-click "see what we found about you" scan. */
  leadWebsite: string;
  /** wall/hook: signup primary, Customer Voice secondary (unchanged
   *  default). paid_scan: swapped — the Customer Voice report ($9/$19)
   *  is the primary ask, signup becomes the smaller link. combo: both
   *  shown as equal-weight buttons, matching the copy's "two options"
   *  framing. Must match whatever variant generated bodyText, or the
   *  CTA won't match the copy the reader just read. */
  variant: "wall" | "hook" | "paid_scan" | "combo";
}

// Always the real production domain, never NEXT_PUBLIC_APP_URL — that
// env var is http://localhost:3000 in local dev, and these links go
// into an email a real recipient clicks, not something reachable
// from the sender's own machine. Hardcoded, matching how
// founder-checkin.ts references testimoni.io/tools directly.
const APP_URL = "https://testimoni.io";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function leadOutreachEmailHtml(data: LeadOutreachEmailData): string {
  const { bodyText, senderName, senderEmail, leadWebsite, variant } = data;
  const senderFirst = senderName.split(" ")[0];
  const campaign = `growth_engine_outreach_${variant}`;

  const signupUrl = withUtm(`${APP_URL}/signup`, {
    source: "email",
    medium: "email",
    campaign,
    content: "signup_cta",
  });
  const customerVoiceUrl = withUtm(
    `${APP_URL}/tools/customer-voice?url=${encodeURIComponent(leadWebsite)}&from=lead_email`,
    { source: "email", medium: "email", campaign, content: "customer_voice_link" }
  );

  const paragraphsHtml = bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;">${escapeHtml(p)}</p>`)
    .join("");

  const primaryHtml =
    variant === "combo"
      ? // Two equal-weight buttons — matches the copy's explicit "two
        // options, pick whichever" framing. Stacked (not side-by-side)
        // so it never breaks on a narrow mobile inbox.
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 6px 0;">
                <tr>
                  <td style="background-color:#5b21b6;border-radius:8px;">
                    <a href="${customerVoiceUrl}" target="_blank" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      See what we found — from $9 &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
                <tr>
                  <td style="background-color:#ffffff;border:2px solid #5b21b6;border-radius:8px;">
                    <a href="${signupUrl}" target="_blank" style="display:inline-block;padding:10px 20px;color:#5b21b6;font-size:15px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Start a Wall of Love — $9/mo &rarr;
                    </a>
                  </td>
                </tr>
              </table>`
      : variant === "paid_scan"
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 10px 0;">
                <tr>
                  <td style="background-color:#5b21b6;border-radius:8px;">
                    <a href="${customerVoiceUrl}" target="_blank" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      See what we found — Quick Scan $9 &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px 0;font-size:13px;">
                <a href="${signupUrl}" target="_blank" style="color:#5b21b6;text-decoration:underline;">Or start a free Wall of Love &rarr;</a>
              </p>`
      : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 10px 0;">
                <tr>
                  <td style="background-color:#5b21b6;border-radius:8px;">
                    <a href="${signupUrl}" target="_blank" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Start your free Wall of Love &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px 0;font-size:13px;">
                <a href="${customerVoiceUrl}" target="_blank" style="color:#5b21b6;text-decoration:underline;">Or see what we found about you first &rarr;</a>
              </p>`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Testimoni</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="font-size:15px;line-height:1.65;color:#1f2937;">
              ${paragraphsHtml}

              <!-- variant-dependent CTA block — see primaryHtml above -->
              ${primaryHtml}

              <p style="margin:0 0 4px 0;">— ${escapeHtml(senderFirst)}</p>
              <p style="margin:0;color:#6b7280;font-size:13px;">
                ${escapeHtml(senderName)} · Testimoni ·
                <a href="mailto:${escapeHtml(senderEmail)}" style="color:#6b7280;text-decoration:underline;">${escapeHtml(senderEmail)}</a>
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
