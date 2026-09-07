/**
 * Reactivation email for founders who signed up but haven't added a
 * testimonial yet. Sent 3-7 days after signup if the workspace's
 * approved testimonial count is still 0. Feels like a personal DM
 * from Neha — not a marketing blast.
 *
 * Same email-safe rules as welcome.ts (table layout, inline styles,
 * 600px width, system fonts, no JS). See that file's header for the
 * full rationale on each rule.
 */

import { withUtm } from "./utm";

export interface ReactivationEmailData {
  /** First name only. Falls back to "there" if unknown. */
  name: string | null;
  /** The recipient's own workspace name — used to open the email with
   *  "your {workspaceName}" so it feels specific, not templated. */
  workspaceName: string;
  /** URL of their empty Wall of Love — the visual anchor they'll click
   *  to remember what they came here for. */
  wallUrl: string;
  /** Direct link to /dashboard/import — the paste-a-tweet path. */
  importUrl: string;
  /** Their live collection form URL — the share-with-a-customer path. */
  collectFormUrl: string;
  /** Reply-to for the "just reply" line at the bottom. Neha's alias. */
  founderReplyEmail?: string;
}

export function reactivationEmailSubject(name: string | null): string {
  const first = firstName(name);
  return first
    ? `${first}, want your first testimonial live in 30 seconds?`
    : `Want your first testimonial live in 30 seconds?`;
}

export function reactivationEmailHtml(data: ReactivationEmailData): string {
  const {
    name,
    workspaceName,
    wallUrl: rawWallUrl,
    importUrl: rawImportUrl,
    collectFormUrl: rawCollectFormUrl,
    founderReplyEmail = "hello@testimoni.io",
  } = data;

  const tag = (u: string, content: string) =>
    withUtm(u, {
      source: "email",
      medium: "email",
      campaign: "reactivation",
      content,
    });

  const wallUrl = tag(rawWallUrl, "empty_wall");
  const importUrl = tag(rawImportUrl, "paste_tweet");
  const collectFormUrl = tag(rawCollectFormUrl, "share_form");

  const greeting = firstName(name)
    ? `Hey ${firstName(name)},`
    : `Hey there,`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Get your first testimonial live</title>
</head>
<body style="margin:0;padding:0;background:#f6f5fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1523;">
  <div style="display:none;max-height:0;overflow:hidden;">
    Paste any customer tweet — live on your wall in 30 seconds. Or share
    your form URL with one past customer. I'll help if you're stuck.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5fb;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(115,72,220,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 16px 40px;">
              <div style="font-size:14px;font-weight:700;color:#7348dc;letter-spacing:0.05em;text-transform:uppercase;">Testimoni</div>
            </td>
          </tr>

          <!-- Greeting + hook -->
          <tr>
            <td style="padding:0 40px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;line-height:1.25;font-weight:800;color:#1a1523;">
                ${greeting}<br>
                Let's get you off zero.
              </h1>
              <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#4b465c;">
                I noticed you signed up for <strong style="color:#1a1523;">${escape(workspaceName)}</strong> but haven't added a testimonial yet. That's the hardest part — I want to make it stupidly easy.
              </p>
              <p style="margin:0;font-size:16px;line-height:1.6;color:#4b465c;">
                Pick whichever path fits you:
              </p>
            </td>
          </tr>

          <!-- Path A: Paste a tweet -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece8f7;border-radius:12px;background:#faf9fd;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:800;color:#7348dc;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;">Path A · Fastest</div>
                    <div style="font-size:18px;font-weight:700;color:#1a1523;margin-bottom:6px;">
                      Paste a customer tweet
                    </div>
                    <div style="font-size:14px;line-height:1.55;color:#4b465c;margin-bottom:16px;">
                      Anyone ever said something nice about your product on X, LinkedIn, Reddit, HN, or Product Hunt? Paste the URL — live on your wall in 30 seconds.
                    </div>
                    <a href="${importUrl}" style="display:inline-block;background:#7348dc;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;">
                      Paste a URL →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Path B: Share your form -->
          <tr>
            <td style="padding:16px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece8f7;border-radius:12px;background:#faf9fd;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:800;color:#7348dc;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;">Path B · If no public praise yet</div>
                    <div style="font-size:18px;font-weight:700;color:#1a1523;margin-bottom:6px;">
                      Send your form to one past customer
                    </div>
                    <div style="font-size:14px;line-height:1.55;color:#4b465c;margin-bottom:16px;">
                      Copy your collection form URL and email it to one happy customer with a two-line ask. Most reply within a day. Your wall goes from zero to one.
                    </div>
                    <a href="${collectFormUrl}" style="display:inline-block;background:#ffffff;color:#7348dc;font-size:14px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;border:1.5px solid #7348dc;">
                      Copy my form URL →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Personal help line -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <div style="border-left:3px solid #7348dc;padding:8px 0 8px 16px;">
                <p style="margin:0;font-size:15px;line-height:1.55;color:#4b465c;">
                  <strong style="color:#1a1523;">Stuck?</strong> Just reply to this email. I'll help you set the whole thing up — form, first testimonial, embed on your site. All of it.
                </p>
              </div>
            </td>
          </tr>

          <!-- Peek at their empty wall -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <p style="margin:0 0 6px 0;font-size:13px;color:#9088a3;">
                Your wall right now:
              </p>
              <a href="${wallUrl}" style="font-size:13px;color:#7348dc;text-decoration:underline;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">
                ${escape(rawWallUrl.replace(/^https?:\/\//, ""))}
              </a>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:32px 40px 40px 40px;">
              <p style="margin:0 0 4px 0;font-size:15px;color:#1a1523;">
                Rooting for you,
              </p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1a1523;">
                Neha
              </p>
              <p style="margin:2px 0 0 0;font-size:13px;color:#9088a3;">
                Founder, Testimoni
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#faf9fd;border-top:1px solid #ece8f7;">
              <p style="margin:0;font-size:11px;line-height:1.6;color:#9088a3;text-align:center;">
                You're getting this because you signed up for Testimoni. Not the right fit right now? <a href="mailto:${founderReplyEmail}?subject=Unsubscribe" style="color:#9088a3;text-decoration:underline;">Reply "unsubscribe"</a> and I won't email you again.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0 0;font-size:11px;color:#9088a3;text-align:center;">
          Testimoni · Sent with 🩷 to <em>you</em>, not a list.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function firstName(name: string | null): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] ?? "";
}

// HTML-escape user-controlled strings so a workspace name with < or &
// can't break the layout or slip in unintended markup.
function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
