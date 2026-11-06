/**
 * The email a workspace sends to ask a customer for a testimonial. Sent
 * on the owner's behalf (the workspace name is the sender name and
 * replies go to the owner), with a one-click opt-out.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function testimonialRequestEmail(p: {
  workspaceName: string;
  name?: string | null;
  formUrl: string;
  optOutUrl: string;
  reminder: boolean;
}): { subject: string; html: string; text: string } {
  const hi = p.name?.trim() ? `Hi ${p.name.trim().split(/\s+/)[0]},` : "Hi,";
  const subject = p.reminder
    ? `A quick reminder: a few words about ${p.workspaceName}?`
    : `Could you share a few words about ${p.workspaceName}?`;
  const lead = p.reminder
    ? `Just a gentle reminder in case my last note got buried. If you have a minute, a short testimonial about ${p.workspaceName} would mean a lot.`
    : `Thanks for being a customer of ${p.workspaceName}. Would you share a short testimonial? It takes about a minute, and you can add a star rating or a short video if you like.`;

  const text = `${hi}\n\n${lead}\n\n${p.formUrl}\n\nThank you,\n${p.workspaceName}\n\nNot interested? ${p.optOutUrl}`;

  const html = `<!doctype html><html><body style="margin:0;background:#f6f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px;">
<tr><td style="font-size:16px;line-height:1.6;">
<p style="margin:0 0 16px 0;">${esc(hi)}</p>
<p style="margin:0 0 24px 0;">${esc(lead)}</p>
<p style="margin:0 0 28px 0;"><a href="${esc(p.formUrl)}" style="display:inline-block;background:#5b21b6;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">Write a testimonial</a></p>
<p style="margin:0;color:#6b7280;font-size:14px;">Thank you,<br>${esc(p.workspaceName)}</p>
</td></tr></table>
<p style="margin:16px 0 0 0;color:#9ca3af;font-size:12px;">Not interested? <a href="${esc(p.optOutUrl)}" style="color:#6b7280;">Don&rsquo;t ask me again</a>. Sent with Testimoni on behalf of ${esc(p.workspaceName)}.</p>
</td></tr></table></body></html>`;

  return { subject, html, text };
}
