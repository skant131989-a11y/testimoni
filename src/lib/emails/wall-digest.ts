/**
 * The weekly note to a workspace owner about their wall: how many people saw
 * it, what is new, and the one thing worth doing next. Plain, short, from the
 * founder. Only sent when something happened (a view, a new testimonial, or
 * something waiting for approval), so it is never an empty "nothing new" mail.
 */

import { withUtm } from "./utm";

export interface WallDigestData {
  ownerName: string;
  workspaceName: string;
  views: number;
  newThisWeek: number;
  pending: number;
  totalApproved: number;
  appUrl: string;
  unsubscribeUrl?: string | null;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

export function wallDigestEmail(d: WallDigestData): { subject: string; html: string; text: string } {
  const hi = d.ownerName.split(" ")[0] || "there";

  const bits: string[] = [];
  if (d.views > 0) bits.push(plural(d.views, "view", "views"));
  if (d.newThisWeek > 0) bits.push(plural(d.newThisWeek, "new testimonial", "new testimonials"));
  if (bits.length === 0 && d.pending > 0) bits.push(`${plural(d.pending, "testimonial", "testimonials")} waiting for you`);
  const subject = `Your wall this week: ${bits.join(", ")}`;

  // One next step, chosen by what is true for this person.
  let nextTitle: string;
  let nextBody: string;
  let ctaLabel: string;
  let ctaPath: string;
  if (d.pending > 0) {
    nextTitle = `${plural(d.pending, "testimonial is", "testimonials are")} waiting for your OK`;
    nextBody = "Until you approve them they are not on your wall. It takes one click each.";
    ctaLabel = "Review them";
    ctaPath = "/dashboard/inbox";
  } else if (d.views === 0) {
    nextTitle = "Nobody has seen your wall yet";
    nextBody = "Put it where visitors decide: your homepage or pricing page. It is one line of code, or just share the link.";
    ctaLabel = "Get my embed code";
    ctaPath = "/dashboard/widgets";
  } else {
    nextTitle = "Keep it growing: ask three more customers";
    nextBody = "Walls with ten or more testimonials convince far more visitors than a handful. Send your form link to the next three people who have said something nice.";
    ctaLabel = "Copy my form link";
    ctaPath = "/dashboard/collect";
  }
  const cta = withUtm(`${d.appUrl}${ctaPath}`, { source: "email", medium: "email", campaign: "wall_digest", content: "cta" });

  const stat = (n: number, label: string) =>
    `<td style="padding:0 18px 0 0;"><div style="font-size:28px;font-weight:800;color:#4c1d95;line-height:1;">${n.toLocaleString("en-US")}</div><div style="font-size:12px;color:#6b7280;margin-top:4px;">${esc(label)}</div></td>`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="font-size:16px;line-height:1.6;">
<p style="margin:0 0 14px 0;">Hi ${esc(hi)},</p>
<p style="margin:0 0 18px 0;">Here is how the ${esc(d.workspaceName)} wall did this week.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px 0;"><tr>
${stat(d.views, d.views === 1 ? "view" : "views")}${stat(d.newThisWeek, "new")}${stat(d.totalApproved, "on your wall")}
</tr></table>
<div style="margin:0 0 20px 0;padding:14px 16px;border-left:3px solid #7c3aed;background-color:#faf7ff;">
<div style="font-weight:700;color:#1f2937;">${esc(nextTitle)}</div>
<div style="margin-top:4px;color:#4b5563;font-size:15px;">${esc(nextBody)}</div>
</div>
<p style="margin:0 0 24px 0;"><a href="${esc(cta)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">${esc(ctaLabel)}</a></p>
<p style="margin:0;">Neha<br><span style="color:#6b7280;font-size:14px;">Testimoni</span></p>
${d.unsubscribeUrl ? `<p style="margin:22px 0 0 0;color:#9ca3af;font-size:12px;">A weekly note about your wall. <a href="${esc(d.unsubscribeUrl)}" style="color:#6b7280;">Stop these</a>.</p>` : ""}
</td></tr></table></td></tr></table></body></html>`;

  const text =
    `Hi ${hi},\n\nHere is how the ${d.workspaceName} wall did this week.\n\n` +
    `${d.views} views · ${d.newThisWeek} new · ${d.totalApproved} on your wall\n\n` +
    `${nextTitle}\n${nextBody}\n\n${ctaLabel}: ${cta}\n\nNeha\nTestimoni` +
    (d.unsubscribeUrl ? `\n\nStop these: ${d.unsubscribeUrl}` : "");

  return { subject, html, text };
}
