/**
 * Reminder to someone who asked for an account but never entered their code.
 *
 * Two short notes, a couple of hours and a couple of days after signing up.
 * Plain-note style with one violet button; the button opens a page where one
 * more tap signs them in (see /open/[token]).
 */

import { withUtm } from "./utm";

export type SignupReminderStage = 1 | 2;

export interface SignupReminderData {
  stage: SignupReminderStage;
  /** Signed link to the /open page. */
  openUrl: string;
  /** Fallback: the login page with the email filled in. */
  loginUrl: string;
  unsubscribeUrl: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function signupReminderEmail(d: SignupReminderData): { subject: string; html: string; text: string } {
  const first = d.stage === 1;
  const subject = first ? "Your Wall of Love is almost ready" : "Your free Wall of Love is waiting";
  const open = withUtm(d.openUrl, { source: "email", medium: "email", campaign: `signup_reminder_${d.stage}`, content: "open_cta" });
  const login = withUtm(d.loginUrl, { source: "email", medium: "email", campaign: `signup_reminder_${d.stage}`, content: "login_link" });

  const lines = first
    ? [
        "You started signing up for Testimoni a little while ago, and it looks like you didn't get to finish.",
        "Your account is set up and waiting. One tap and you are in:",
      ]
    : [
        "Your free Testimoni account is still here. It takes about 30 seconds to get your first testimonial on a wall.",
        "Free for 15 testimonials, with a hosted Wall of Love and a one-line embed for your site. No credit card.",
      ];
  const button = first ? "Open my dashboard" : "Finish setting up";

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="font-size:16px;line-height:1.6;">
<p style="margin:0 0 14px 0;">Hi,</p>
<p style="margin:0 0 14px 0;">${esc(lines[0])}</p>
<p style="margin:0 0 20px 0;">${esc(lines[1])}</p>
<p style="margin:0 0 20px 0;"><a href="${esc(open)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 24px;border-radius:10px;">${button}</a></p>
<p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;">Prefer a code? <a href="${esc(login)}" style="color:#7c3aed;">Send me a new one</a>. If this wasn't you, just ignore this email.</p>
<p style="margin:0;">Neha<br><span style="color:#6b7280;font-size:14px;">Testimoni</span></p>
<p style="margin:18px 0 0 0;color:#9ca3af;font-size:12px;">Not useful? <a href="${esc(d.unsubscribeUrl)}" style="color:#6b7280;">Stop these</a>.</p>
</td></tr></table></td></tr></table></body></html>`;

  const text =
    `Hi,\n\n${lines[0]}\n\n${lines[1]}\n\n${button}: ${open}\n\n` +
    `Prefer a code? Send me a new one: ${login}\nIf this wasn't you, just ignore this email.\n\nNeha\nTestimoni\n\nNot useful? Stop these: ${d.unsubscribeUrl}`;

  return { subject, html, text };
}
