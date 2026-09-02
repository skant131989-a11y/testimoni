/**
 * Welcome email HTML for new Testimoni signups.
 *
 * Email-safe rules baked in:
 * - Table-based layout — Outlook and Gmail's iOS app both drop CSS grid/flex
 * - Inline styles only — <style> blocks are stripped by Gmail webapp
 * - 600px max width — the industry default; wider clips in Outlook
 * - System font stack — no @font-face support in most clients
 * - No JS, no <script> — silently dropped everywhere
 * - Absolute URLs for all links + images — no origin context in an email
 */

import { withUtm } from "./utm";

export interface WelcomeEmailData {
  name: string;
  email: string;
  wallUrl: string;
  workspaceName: string;
  dashboardUrl: string;
  importUrl: string;
  collectFormUrl: string;
  embedPageUrl: string;
}

export function welcomeEmailHtml(data: WelcomeEmailData): string {
  const {
    name,
    wallUrl: rawWallUrl,
    workspaceName,
    dashboardUrl: rawDashboardUrl,
    importUrl: rawImportUrl,
    collectFormUrl: rawCollectFormUrl,
    embedPageUrl: rawEmbedPageUrl,
  } = data;

  const tag = (u: string, content: string) =>
    withUtm(u, {
      source: "email",
      medium: "email",
      campaign: "welcome",
      content,
    });

  const wallUrl = tag(rawWallUrl, "wall_url");
  const dashboardUrl = tag(rawDashboardUrl, "open_dashboard");
  const importUrl = tag(rawImportUrl, "import_tweet");
  const collectFormUrl = tag(rawCollectFormUrl, "form_url");
  const embedPageUrl = tag(rawEmbedPageUrl, "embed_code");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Welcome to Testimoni</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f6f5fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f6f5fb;line-height:1px;">
    Your Wall of Love is live — here's how to fill it in the next 5 minutes.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f5fb;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(76,29,149,0.06);overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid #f1f0f7;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#5b21b6;color:#ffffff;font-size:22px;font-weight:900;font-family:Georgia,serif;width:36px;height:36px;text-align:center;border-radius:18px;line-height:36px;padding-bottom:4px;">
                          &ldquo;
                        </td>
                        <td style="padding-left:12px;font-size:20px;font-weight:800;color:#1a1a1a;letter-spacing:-0.01em;">
                          Testimoni
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;font-weight:800;color:#1a1a1a;letter-spacing:-0.01em;">
                Welcome, ${escapeHtml(name)}! Your Wall of Love is live.
              </h1>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4b5563;">
                Your <strong style="color:#1a1a1a;">${escapeHtml(workspaceName)}</strong> workspace is set up and every intake path is ready to go — paste a tweet, share a form, or drop the embed on your site.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf5ff;border:1px solid #ede9fe;border-radius:10px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#5b21b6;letter-spacing:0.08em;text-transform:uppercase;">
                      Your public Wall of Love URL
                    </p>
                    <a href="${escapeAttr(wallUrl)}" target="_blank" style="color:#5b21b6;font-size:14px;font-weight:600;text-decoration:none;word-break:break-all;">
                      ${escapeHtml(wallUrl)}
                    </a>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
                      <tr>
                        <td style="background-color:#5b21b6;border-radius:6px;">
                          <a href="${escapeAttr(wallUrl)}" target="_blank" style="display:inline-block;padding:8px 16px;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">
                            Open my wall &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:12px 0 0 0;font-size:13px;line-height:1.5;color:#6b7280;">
                      Drop the URL in your Instagram bio, email signature, or a QR code on your packaging. Anyone can view — no signup required.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <h2 style="margin:0 0 4px 0;font-size:16px;font-weight:700;color:#1a1a1a;">
                Three things you can do in the next 5 minutes
              </h2>
            </td>
          </tr>

          ${actionRow({
            number: "1",
            title: "Paste a tweet",
            body: "Turn any public X or LinkedIn post about your work into an approved testimonial. Author + text pulled automatically — no screenshots.",
            ctaLabel: "Import a tweet →",
            ctaUrl: importUrl,
          })}
          ${actionRow({
            number: "2",
            title: "Share your collection form",
            body: "Send this link to your last 3 customers. Every submission lands in your inbox for one-click approval.",
            ctaLabel: "Get your form URL →",
            ctaUrl: collectFormUrl,
          })}
          ${actionRow({
            number: "3",
            title: "Drop the embed on your site",
            body: "One line of code puts your wall on Framer, Webflow, WordPress, React, or plain HTML. Updates automatically as you approve more.",
            ctaLabel: "Copy embed code →",
            ctaUrl: embedPageUrl,
          })}

          <tr>
            <td style="padding:8px 40px 4px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf5ff;border:1px solid #ede9fe;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#5b21b6;">
                      🎥 1 free video testimonial on every plan
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#4b5563;">
                      Upload an MP4/MOV or ask a customer to record from their phone. Video converts ~2× better than text. Upgrade to Pro for unlimited.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 40px 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-top:16px;border-top:1px solid #f1f0f7;">
                    <a href="${escapeAttr(dashboardUrl)}" target="_blank" style="display:inline-block;background-color:#5b21b6;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                      Open your dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px 32px 40px;border-top:1px solid #f1f0f7;background-color:#faf9fc;">
              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#4b5563;">
                Need help getting started? Just reply to this email — it goes straight to us.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;">
                — Team Testimoni
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin-top:20px;">
          <tr>
            <td align="center" style="padding:0 20px;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">
                Testimoni · <a href="mailto:hello@testimoni.io" style="color:#9ca3af;text-decoration:underline;">hello@testimoni.io</a>
              </p>
              <p style="margin:6px 0 0 0;font-size:12px;line-height:1.5;color:#9ca3af;">
                You're receiving this because you signed up for Testimoni.
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

function actionRow({
  number,
  title,
  body,
  ctaLabel,
  ctaUrl,
}: {
  number: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  return `
  <tr>
    <td style="padding:12px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:top;width:36px;padding-right:14px;">
            <div style="width:28px;height:28px;background-color:#ede9fe;color:#5b21b6;border-radius:14px;text-align:center;font-size:13px;font-weight:800;line-height:28px;">${number}</div>
          </td>
          <td style="vertical-align:top;">
            <p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:#1a1a1a;">${escapeHtml(title)}</p>
            <p style="margin:0 0 8px 0;font-size:14px;line-height:1.55;color:#4b5563;">${escapeHtml(body)}</p>
            <a href="${escapeAttr(ctaUrl)}" target="_blank" style="color:#5b21b6;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(ctaLabel)}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
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
