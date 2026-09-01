/**
 * Founder check-in email — personal note sent 3-5 days after signup
 * from a founder alias (default hello@testimoni.io or founder-specific).
 *
 * Design intent: this should NOT look like marketing. It's a text
 * email — no big buttons, no purple hero, no headers. Just a personal
 * note that happens to include the user's wall URL. That personal
 * feel is what makes founder emails work; the moment it looks
 * templated the reply rate craters.
 *
 * Still uses inline styles + table for basic Gmail/Outlook safety,
 * but nothing decorative.
 */

export interface FounderEmailData {
  name: string;
  email: string;
  workspaceName: string;
  wallUrl: string;
  founderName: string;
  founderEmail: string;
}

export function founderEmailHtml(data: FounderEmailData): string {
  const { name, workspaceName, wallUrl, founderName, founderEmail } = data;
  const firstName = founderName.split(" ")[0];

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Quick check-in from ${escapeHtml(firstName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#ffffff;line-height:1px;">
    Two quick questions about your first few days on Testimoni.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="font-size:15px;line-height:1.65;color:#1f2937;">
              <p style="margin:0 0 16px 0;">Hi ${escapeHtml(name)},</p>

              <p style="margin:0 0 16px 0;">
                ${escapeHtml(firstName)} here — one of the founders of Testimoni.
              </p>

              <p style="margin:0 0 16px 0;">
                Saw you set up <strong style="color:#1a1a1a;">${escapeHtml(workspaceName)}</strong> a few days back. I try to write to every new user in the first week, so — how did it go?
              </p>

              <p style="margin:0 0 8px 0;">Two things I&rsquo;d love to know:</p>
              <ol style="margin:0 0 20px 0;padding-left:22px;">
                <li style="margin-bottom:8px;">
                  Did you get to import a tweet, share your form, or drop the embed anywhere? (Even one of those.)
                </li>
                <li style="margin-bottom:8px;">
                  What almost stopped you? A confusing screen, a missing feature, a broken step — anything. One sentence is enough. I fix these fast.
                </li>
              </ol>

              <p style="margin:0 0 8px 0;color:#4b5563;font-size:14px;">
                Your Wall of Love (in case you need the URL again):
              </p>
              <p style="margin:0 0 24px 0;">
                <a href="${escapeAttr(wallUrl)}" target="_blank" style="color:#5b21b6;text-decoration:underline;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;word-break:break-all;">
                  ${escapeHtml(wallUrl)}
                </a>
              </p>

              <p style="margin:0 0 16px 0;">
                Just hit reply — this email lands directly in my inbox, not a support queue.
              </p>

              <p style="margin:0 0 4px 0;">Thanks,</p>
              <p style="margin:0 0 24px 0;">
                ${escapeHtml(firstName)}<br />
                <span style="color:#6b7280;font-size:13px;">
                  ${escapeHtml(founderName)} &middot; Testimoni &middot;
                  <a href="mailto:${escapeAttr(founderEmail)}" style="color:#6b7280;text-decoration:underline;">${escapeHtml(founderEmail)}</a>
                </span>
              </p>

              <p style="margin:0;padding-top:16px;border-top:1px solid #f1f0f7;color:#9ca3af;font-size:12px;line-height:1.5;">
                P.S. If you&rsquo;d rather do this over a 15-minute call, I&rsquo;m happy to jump on. Just say when.
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
