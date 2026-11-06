/**
 * Short, plain onboarding emails from the founder to people who signed up
 * but haven't got their wall going. Two touches only:
 *   day 3: nothing on the wall yet
 *   day 7: a few testimonials, but not asking customers yet
 */

export type LifecycleKind = "day3_empty_wall" | "day7_ask_customers";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export function lifecycleEmail(
  kind: LifecycleKind,
  p: { name?: string | null; unsubscribeUrl: string }
): { subject: string; html: string; text: string } {
  const first = p.name?.trim().split(/\s+/)[0];
  const hi = first ? `Hi ${first},` : "Hi,";

  const copy: Record<LifecycleKind, { subject: string; lines: string[]; cta: string; href: string; ps: string }> = {
    day3_empty_wall: {
      subject: "Your Testimoni wall is still empty. Want a hand?",
      lines: [
        "You signed up a few days ago, so I wanted to check in: your wall doesn't have any testimonials yet.",
        "The quickest way to fix that takes about a minute. Paste your website into Find my praise and it searches X, LinkedIn, Reddit and more for real posts about you. Pick the ones you like and they go on your wall with the author and a link to the original.",
        "Nothing to find yet? Send your collection form to two or three happy customers instead.",
      ],
      cta: "Find my praise",
      href: `${APP}/tools/find-my-proof`,
      ps: "If something confused you or didn't work, just reply to this email. I read every reply.",
    },
    day7_ask_customers: {
      subject: "A faster way to get testimonials from customers",
      lines: [
        "You've started your wall, which is the hard part. The next step is asking customers, and most people never do.",
        "Testimoni can ask for you: paste a list of customer emails (or call a webhook from Stripe, Shopify or Zapier when someone buys), and each person gets a short email with your form, plus one reminder if they don't reply.",
        "The free plan includes 10 request emails a month.",
      ],
      cta: "Send my first requests",
      href: `${APP}/dashboard/requests`,
      ps: "Tell me what would make this more useful for you. Just reply.",
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
