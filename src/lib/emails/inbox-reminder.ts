/**
 * Reminder to a workspace owner: testimonials people left for them are still
 * waiting for approval after a day or more. One email covers everything that
 * is waiting, and each submission is only ever reminded about once.
 *
 * Plain-note style like submission-notify.ts: it reads as a short message,
 * shows who said what, and has one button into the inbox.
 */

import { withUtm } from "./utm";

export interface InboxReminderItem {
  name: string;
  snippet: string;
  rating: number | null;
  /** Signed one-tap review page for this one. */
  approveUrl?: string | null;
}

export interface InboxReminderData {
  ownerName: string;
  workspaceName: string;
  items: InboxReminderItem[];
  /** Waiting for approval in total (may be more than the items shown). */
  total: number;
  /** How long the oldest one has been waiting, in whole days (at least 1). */
  oldestDays: number;
  inboxUrl: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function inboxReminderSubject(d: { total: number; firstName: string }): string {
  return d.total === 1
    ? `${d.firstName} left you a testimonial. It's waiting for your OK`
    : `${d.total} testimonials are waiting for your OK`;
}

export function inboxReminderEmail(data: InboxReminderData): { subject: string; html: string; text: string } {
  const first = data.items[0]?.name?.split(/\s+/)[0] || "Someone";
  const hi = data.ownerName.split(" ")[0] || "there";
  const subject = inboxReminderSubject({ total: data.total, firstName: first });
  const url = withUtm(data.inboxUrl, { source: "email", medium: "email", campaign: "inbox_reminder", content: "inbox_cta" });
  const days = data.oldestDays <= 1 ? "a day" : `${data.oldestDays} days`;

  const intro =
    data.total === 1
      ? `${first} took the time to leave a testimonial for ${data.workspaceName}, and it has been waiting for your approval for ${days}. Until you approve it, it is not on your wall.`
      : `${data.total} people left testimonials for ${data.workspaceName} and they have been waiting for your approval, the oldest for ${days}. Until you approve them, they are not on your wall.`;

  const stars = (n: number | null) => (n && n >= 1 && n <= 5 ? "★".repeat(n) + "☆".repeat(5 - n) : "");
  const itemsHtml = data.items
    .map(
      (i) =>
        `<div style="margin:0 0 12px 0;padding:12px 14px;border-left:3px solid #7c3aed;background-color:#faf7ff;">` +
        (stars(i.rating) ? `<div style="color:#f59e0b;font-size:15px;letter-spacing:2px;">${stars(i.rating)}</div>` : "") +
        (i.snippet ? `<div style="margin:4px 0;font-style:italic;color:#1f2937;">&ldquo;${esc(i.snippet)}&rdquo;</div>` : "") +
        `<div style="font-size:13px;color:#6b7280;">${esc(i.name)}` +
        (i.approveUrl
          ? ` &middot; <a href="${esc(i.approveUrl)}" style="color:#7c3aed;font-weight:600;text-decoration:none;">Approve or reject</a>`
          : "") +
        `</div></div>`
    )
    .join("");
  const more = data.total > data.items.length ? `<p style="margin:0 0 16px 0;color:#6b7280;font-size:14px;">…and ${data.total - data.items.length} more.</p>` : "";

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="font-size:16px;line-height:1.6;">
<p style="margin:0 0 14px 0;">Hi ${esc(hi)},</p>
<p style="margin:0 0 16px 0;">${esc(intro)}</p>
${itemsHtml}${more}
<p style="margin:20px 0 24px 0;"><a href="${esc(url)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">Review ${data.total === 1 ? "it" : "them"} now</a></p>
<p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;">It takes one click each. People who leave a testimonial are glad to see it used, so don't leave them waiting.</p>
<p style="margin:0;">Neha<br><span style="color:#6b7280;font-size:14px;">Testimoni</span></p>
</td></tr></table></td></tr></table></body></html>`;

  const text =
    `Hi ${hi},\n\n${intro}\n\n` +
    data.items.map((i) => `${stars(i.rating)} "${i.snippet}" — ${i.name}`.trim()).join("\n") +
    (data.total > data.items.length ? `\n…and ${data.total - data.items.length} more.` : "") +
    `\n\nReview ${data.total === 1 ? "it" : "them"} now: ${url}\n\nNeha\nTestimoni`;

  return { subject, html, text };
}
