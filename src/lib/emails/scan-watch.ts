/**
 * The one email sent to someone who asked to be told when more public
 * praise turns up for a website (see /api/watch).
 */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export function scanWatchEmail(p: {
  brand: string;
  count: number;
  tool: "find-proof" | "customer-voice";
  scanId: string;
  siteUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  const noun = p.count === 1 ? "mention" : "mentions";
  const href =
    p.tool === "customer-voice"
      ? `${APP}/tools/customer-voice/${p.scanId}?from=watch_email`
      : `${APP}/tools/find-my-proof?url=${encodeURIComponent(p.siteUrl)}&from=watch_email`;
  const subject = `We found ${p.count} ${noun} of ${p.brand}`;
  const lines = [
    `You asked us to tell you if public praise showed up for ${p.brand}. We checked again and found ${p.count} ${noun}.`,
    "Open the result to read them, each with its source link. You can put the good ones on a Wall of Love for your website. It's free for up to 15 testimonials.",
  ];
  const cta = "See what we found";
  const text = `Hi,\n\n${lines.join("\n\n")}\n\n${cta}: ${href}\n\nNeha\nTestimoni\n\nYou got this because you asked us to check. Stop these: ${p.unsubscribeUrl}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f6f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:12px;padding:32px;">
<tr><td style="font-size:16px;line-height:1.65;">
<p style="margin:0 0 16px 0;">Hi,</p>
${lines.map((l) => `<p style="margin:0 0 16px 0;">${esc(l)}</p>`).join("\n")}
<p style="margin:8px 0 24px 0;"><a href="${esc(href)}" style="display:inline-block;background:#5b21b6;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">${esc(cta)}</a></p>
<p style="margin:0;">Neha<br><span style="color:#6b7280;font-size:14px;">Testimoni</span></p>
</td></tr></table>
<p style="margin:16px 0 0 0;color:#9ca3af;font-size:12px;">You got this because you asked us to check. <a href="${esc(p.unsubscribeUrl)}" style="color:#6b7280;">Stop these emails</a>.</p>
</td></tr></table></body></html>`;
  return { subject, html, text };
}
