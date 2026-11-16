/**
 * Two reminders during the 14-day Pro trial: 4 days left and 1 day left.
 * Plain founder emails, one clear next step, an unsubscribe link.
 */

export type TrialKind = "trial_day10" | "trial_day13";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export function trialEmail(
  kind: TrialKind,
  p: { name?: string | null; testimonials: number; audits: number; unsubscribeUrl: string }
): { subject: string; html: string; text: string } {
  const first = p.name?.trim().split(/\s+/)[0];
  const hi = first ? `Hi ${first},` : "Hi,";

  const did: string[] = [];
  if (p.testimonials > 0) did.push(`${p.testimonials} testimonial${p.testimonials === 1 ? "" : "s"} on your wall`);
  if (p.audits > 0) did.push(`${p.audits} proof placement audit${p.audits === 1 ? "" : "s"} run`);
  const progress = did.length > 0 ? `So far you have ${did.join(" and ")}.` : "You haven't used much of it yet, and there's still time.";

  const copy: Record<TrialKind, { subject: string; lines: string[]; cta: string; href: string; ps: string }> = {
    trial_day10: {
      subject: "4 days left of your Testimoni Pro trial",
      lines: [
        `Your Pro trial ends in 4 days. ${progress}`,
        "If you haven't yet, run the proof placement audit on your site. It shows which pages have no customer proof and which of your testimonials belong on each one. That's the quickest way to see whether Pro is worth it for you.",
        "Keeping Pro is $19 a month, flat, and you can cancel any time. If you do nothing, you go back to the Free plan and everything you added stays on your wall.",
      ],
      cta: "Run the audit",
      href: `${APP}/dashboard/proof-placement`,
      ps: "Reply and tell me what you'd want Pro to do that it doesn't. I read every reply.",
    },
    trial_day13: {
      subject: "Your Testimoni Pro trial ends tomorrow",
      lines: [
        `Your Pro trial ends tomorrow. ${progress}`,
        "Tomorrow your account returns to the Free plan: 15 testimonials, 2 videos, and one proof audit. Nothing you've added is deleted.",
        "To keep unlimited testimonials, the proof placement audit, deeper praise scans and no badge, Pro is $19 a month. No contract.",
      ],
      cta: "Keep Pro",
      href: `${APP}/dashboard/settings/billing`,
      ps: "Not for you? Reply and tell me why. It helps a lot.",
    },
  };

  const c = copy[kind];
  const text = `${hi}\n\n${c.lines.join("\n\n")}\n\n${c.cta}: ${c.href}\n\n${c.ps}\n\nNeha\nTestimoni\n\nNot useful? Unsubscribe: ${p.unsubscribeUrl}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f6f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:12px;padding:32px;">
<tr><td style="font-size:16px;line-height:1.65;">
<p style="margin:0 0 16px 0;">${esc(hi)}</p>
${c.lines.map((l) => `<p style="margin:0 0 16px 0;">${esc(l)}</p>`).join("\n")}
<p style="margin:8px 0 24px 0;"><a href="${esc(c.href)}" style="display:inline-block;background:#5b21b6;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">${esc(c.cta)}</a></p>
<p style="margin:0 0 16px 0;color:#4b5563;">${esc(c.ps)}</p>
<p style="margin:0;">Neha<br><span style="color:#6b7280;font-size:14px;">Testimoni</span></p>
</td></tr></table>
<p style="margin:16px 0 0 0;color:#9ca3af;font-size:12px;">Not useful? <a href="${esc(p.unsubscribeUrl)}" style="color:#6b7280;">Unsubscribe</a>.</p>
</td></tr></table></body></html>`;

  return { subject: c.subject, html, text };
}
