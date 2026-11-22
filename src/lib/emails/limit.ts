/**
 * Emails for free workspaces that are filling up: at 10 testimonials (five
 * spots left), and when the free wall is full and something real is waiting
 * for approval. Short notes from the founder, one action each: start the
 * 14-day trial if they have not used it, otherwise upgrade.
 */

import { withUtm } from "./utm";

export type LimitKind = "limit_10" | "limit_full" | "limit_full_reminder";

export interface LimitEmailData {
  ownerName: string;
  /** Testimonials on the wall now. */
  count: number;
  /** Free plan cap (15). */
  max: number;
  /** Submissions waiting for approval. */
  pending: number;
  /** First name of the newest waiting submission, if any. */
  pendingName?: string | null;
  /** True when this workspace has never used the 14-day trial. */
  trialEligible: boolean;
  appUrl: string;
  unsubscribeUrl?: string | null;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function limitEmail(kind: LimitKind, d: LimitEmailData): { subject: string; html: string; text: string } {
  const hi = d.ownerName.split(" ")[0] || "there";
  const left = Math.max(0, d.max - d.count);
  const who = d.pendingName?.trim().split(/\s+/)[0] || "Someone";
  const waiting =
    d.pending === 1 ? `${who}'s testimonial is waiting` : `${d.pending} testimonials are waiting`;

  const offer = d.trialEligible
    ? "You can try Pro free for 14 days, no card needed. Nothing is deleted either way: if you do nothing, you simply go back to Free."
    : "Pro is a flat $19 a month, with no tiers and no per-seat pricing.";
  const perks = "Pro removes the cap: unlimited testimonials, no “Powered by” badge, all five layouts, and a weekly scan for new praise about you.";

  let subject: string;
  let lines: string[];
  if (kind === "limit_10") {
    subject = `Your wall is nearly full: ${left} spots left`;
    lines = [
      `You have ${d.count} testimonials on your Testimoni wall. The free plan holds ${d.max}, so there are ${left} spots left.`,
      "That is a good problem to have. A wall with real proof on it converts more of the people who visit your site.",
      `${perks} ${offer}`,
    ];
  } else if (kind === "limit_full") {
    subject = d.pending === 1 ? `${who}'s testimonial is waiting, but your free wall is full` : `${d.pending} testimonials are waiting, but your free wall is full`;
    lines = [
      `${waiting} for your approval, and it cannot go on your wall: the free plan holds ${d.max} testimonials and you have ${d.count}.`,
      "You can make room by removing an older one, or lift the cap.",
      `${perks} ${offer}`,
    ];
  } else {
    subject = d.pending === 1 ? "One testimonial still can't go on your wall" : `${d.pending} testimonials still can't go on your wall`;
    lines = [
      `${waiting} for your approval, and your free wall is still full (${d.count} of ${d.max}).`,
      `${perks} ${offer}`,
    ];
  }

  const cta = d.trialEligible
    ? { label: "Start my 14-day Pro trial", path: "/dashboard?src=limit_email" }
    : { label: "See Pro, $19/month", path: "/dashboard/settings/billing?src=limit_email" };
  const href = withUtm(`${d.appUrl}${cta.path}`, { source: "email", medium: "email", campaign: kind, content: "cta" });
  const secondary = d.pending > 0 ? `${d.appUrl}/dashboard/inbox` : null;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="font-size:16px;line-height:1.6;">
<p style="margin:0 0 14px 0;">Hi ${esc(hi)},</p>
${lines.map((l) => `<p style="margin:0 0 16px 0;">${esc(l)}</p>`).join("\n")}
<p style="margin:20px 0 ${secondary ? "10px" : "24px"} 0;"><a href="${esc(href)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">${esc(cta.label)}</a></p>
${secondary ? `<p style="margin:0 0 24px 0;font-size:14px;"><a href="${esc(secondary)}" style="color:#6b7280;">Or open your inbox</a></p>` : ""}
<p style="margin:0;">Neha<br><span style="color:#6b7280;font-size:14px;">Testimoni</span></p>
${d.unsubscribeUrl ? `<p style="margin:22px 0 0 0;color:#9ca3af;font-size:12px;">Not useful? <a href="${esc(d.unsubscribeUrl)}" style="color:#6b7280;">Stop these</a>.</p>` : ""}
</td></tr></table></td></tr></table></body></html>`;

  const text = `Hi ${hi},\n\n${lines.join("\n\n")}\n\n${cta.label}: ${href}\n${secondary ? `Or open your inbox: ${secondary}\n` : ""}\nNeha\nTestimoni${d.unsubscribeUrl ? `\n\nStop these: ${d.unsubscribeUrl}` : ""}`;

  return { subject, html, text };
}
