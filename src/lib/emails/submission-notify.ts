/**
 * Email notification sent to a workspace owner every time a new
 * submission arrives on one of their collection forms.
 *
 * Design: plain-note style matching founder-checkin.ts + pitch.ts.
 * No hero image, no branded pill CTA. Reads like the workspace owner
 * dropped it in your inbox themselves. The primary action is a link
 * back into the /dashboard/inbox where the actual approve/reject
 * lives.
 *
 * Same table-based layout for Outlook safety, inline styles, 560px
 * width.
 */

import { withUtm } from "./utm";

export interface SubmissionNotifyEmailData {
  ownerName: string;
  workspaceName: string;
  formName: string;
  customerName: string;
  customerEmail?: string | null;
  customerTitle?: string | null;
  content?: string | null;
  rating?: number | null;
  inboxUrl: string;
}

export function submissionNotifyEmailHtml(data: SubmissionNotifyEmailData): string {
  const {
    ownerName,
    workspaceName,
    formName,
    customerName,
    customerEmail,
    customerTitle,
    content,
    rating,
    inboxUrl: rawInboxUrl,
  } = data;
  const firstName = ownerName.split(" ")[0] || ownerName;

  const inboxUrl = withUtm(rawInboxUrl, {
    source: "email",
    medium: "email",
    campaign: "submission_notify",
    content: "inbox_cta",
  });

  const stars =
    typeof rating === "number" && rating >= 1 && rating <= 5
      ? "★".repeat(rating) + "☆".repeat(5 - rating)
      : "";

  const contentBlock = content
    ? `<div style="margin:12px 0 16px 0;padding:12px 14px;border-left:3px solid #7c3aed;background-color:#faf7ff;color:#1f2937;font-style:italic;">${escapeHtml(content).replace(/\n/g, "<br />")}</div>`
    : `<p style="margin:12px 0 16px 0;color:#6b7280;font-style:italic;">(No written testimonial — just a rating.)</p>`;

  const ratingBlock = stars
    ? `<p style="margin:0 0 10px 0;color:#f59e0b;font-size:18px;letter-spacing:2px;">${stars}</p>`
    : "";

  const emailLine = customerEmail
    ? `<p style="margin:2px 0;font-size:13px;color:#6b7280;">&lt;${escapeHtml(customerEmail)}&gt;</p>`
    : "";
  const titleLine = customerTitle
    ? `<p style="margin:2px 0;font-size:13px;color:#6b7280;">${escapeHtml(customerTitle)}</p>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>New testimonial for ${escapeHtml(workspaceName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#ffffff;line-height:1px;">
    ${escapeHtml(customerName)} just submitted a testimonial.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="font-size:15px;line-height:1.65;color:#1f2937;">
              <p style="margin:0 0 16px 0;">Hi ${escapeHtml(firstName)},</p>

              <p style="margin:0 0 16px 0;">
                <strong style="color:#1a1a1a;">${escapeHtml(customerName)}</strong> just submitted a testimonial to
                <strong style="color:#1a1a1a;">${escapeHtml(formName)}</strong>.
              </p>

              ${emailLine}${titleLine}
              ${ratingBlock}

              ${contentBlock}

              <p style="margin:0 0 12px 0;color:#4b5563;font-size:14px;">
                Review it in your inbox to approve or reject — approved ones
                flow onto your Wall of Love automatically.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="background-color:#5b21b6;border-radius:8px;">
                    <a href="${escapeAttr(inboxUrl)}" target="_blank" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Review in inbox &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;padding-top:16px;border-top:1px solid #f1f0f7;color:#9ca3af;font-size:12px;line-height:1.5;">
                You're receiving this because you own the ${escapeHtml(workspaceName)} workspace on Testimoni. Turn these off any time in Dashboard → Settings.
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

export function submissionNotifyEmailSubject(customerName: string, workspaceName: string): string {
  const clean = customerName.trim().split(/\s+/)[0] || "Someone";
  return `${clean} left a testimonial on ${workspaceName}`;
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
