import { withUtm } from "./utm";

/**
 * Weekly "we found public praise of your product" email. Personal-note
 * style, same shell as the other founder emails. Quotes are the real
 * scan results (third-party text, always escaped) — nothing generated.
 */

const APP_URL = "https://testimoni.io";

export interface NewMentionsEmailData {
  name: string | null;
  website: string;
  praiseCount: number;
  scanId: string;
  quotes: Array<{ content: string; author: string; source: string }>;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

export function newMentionsSubject(praiseCount: number, website: string): string {
  return `${praiseCount} people are already praising ${website}`;
}

export function newMentionsText(d: NewMentionsEmailData): string {
  const first = d.name?.split(" ")[0] || "there";
  const quotes = d.quotes
    .slice(0, 2)
    .map((q) => `“${clip(q.content, 200)}” — ${q.author}, ${q.source}`)
    .join("\n\n");
  return `Hi ${first},

I looked for public mentions of ${d.website} and found ${d.praiseCount} that read as praise — on X, Reddit and LinkedIn.

${quotes}

See them all and add the best ones to your Wall of Love: ${APP_URL}/tools/customer-voice/${d.scanId}

— Neha, Testimoni

Don't want these? Reply "stop" and I won't send them again.`;
}

export function newMentionsHtml(d: NewMentionsEmailData): string {
  const first = d.name?.split(" ")[0] || "there";
  const link = withUtm(`${APP_URL}/tools/customer-voice/${d.scanId}`, {
    source: "email",
    medium: "email",
    campaign: "weekly_mentions",
    content: "see_mentions",
  });
  const quotes = d.quotes
    .slice(0, 2)
    .map(
      (q) => `<blockquote style="margin:0 0 14px 0;padding:10px 14px;border-left:3px solid #5b21b6;background:#faf5ff;color:#374151;">
        “${esc(clip(q.content, 200))}”
        <div style="margin-top:6px;font-size:13px;color:#6b7280;">— ${esc(q.author)}, ${esc(q.source)}</div>
      </blockquote>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Testimoni</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:40px 20px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;"><tr><td style="font-size:15px;line-height:1.65;">
      <p style="margin:0 0 16px 0;">Hi ${esc(first)},</p>
      <p style="margin:0 0 16px 0;">I looked for public mentions of <strong>${esc(d.website)}</strong> and found <strong>${d.praiseCount}</strong> that read as praise — on X, Reddit and LinkedIn. A couple of them:</p>
      ${quotes}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 20px 0;"><tr>
        <td style="background-color:#5b21b6;border-radius:8px;">
          <a href="${link}" target="_blank" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">See them all &amp; add to my wall &rarr;</a>
        </td>
      </tr></table>
      <p style="margin:0 0 4px 0;">— Neha</p>
      <p style="margin:0 0 18px 0;color:#6b7280;font-size:13px;">Testimoni · <a href="mailto:neha@testimoni.io" style="color:#6b7280;">neha@testimoni.io</a></p>
      <p style="margin:0;color:#9ca3af;font-size:12px;">Don&apos;t want these? Reply &ldquo;stop&rdquo; and I won&apos;t send them again.</p>
    </td></tr></table>
  </td></tr></table>
</body></html>`;
}
