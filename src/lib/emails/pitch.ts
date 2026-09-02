/**
 * Outreach / pitch email — sent by the founder to a specific person
 * (fellow founder, sales lead, or marketing lead) to introduce
 * Testimoni.
 *
 * Personal-note style, not marketing HTML. Feels like a real 1:1
 * email — no headers, no branded pill CTAs, no "You're receiving
 * this because..." fine print. Just three short paragraphs and a
 * signature.
 *
 * Same design principles as founder-checkin.ts: table-based layout
 * so Outlook doesn't strip it, inline styles, 560px width, no
 * imagery. Reads like it was typed just for them.
 */

import { withUtm } from "./utm";

export type PitchAudience = "founder" | "sales" | "marketing";

export interface PitchEmailData {
  /** First name of the person you're writing to. */
  recipientName: string;
  /** Optional — mention if relevant ("saw your recent launch at Acme"). */
  companyName?: string;
  /** Optional — an actual tweet URL praising them, imported live. */
  praiseTweetUrl?: string;
  audience: PitchAudience;
  senderName: string;
  senderEmail: string;
  landingUrl: string;
}

const HOOK_BY_AUDIENCE: Record<PitchAudience, { hook: string; body: string; bullets: string[]; cta: string }> = {
  founder: {
    hook: "You already know social proof moves customers. What if collecting it took 30 seconds instead of 30 minutes?",
    body: "I built Testimoni for exactly this. Paste a customer's tweet or LinkedIn post URL — we pull the author, photo, and text into a testimonial. Approve it, and it's live.",
    bullets: [
      "Public <strong>Wall of Love URL</strong> — share in bios, DMs, or a QR code on your packaging. No visitor signup needed to view.",
      "One-line embed for your site — Framer, Webflow, WordPress, React, or plain HTML. Sub-10KB widget, no CSS conflicts.",
      "<strong>Video testimonials</strong> — 1 free on every plan; customers record from their phone. Converts ~2× better than text alone.",
    ],
    cta: "Free plan is enough for the whole flow — 10 testimonials, unlimited wall views, no credit card. If it doesn't save you an hour this week I'd genuinely like to know why.",
  },
  sales: {
    hook: "Sales asks for testimonials all the time. Here's a way to have them ready before anyone asks.",
    body: "Testimoni pulls praise from X or LinkedIn into a Wall of Love — a public URL you can drop in email signatures, deck slides, DMs, or on a landing page.",
    bullets: [
      "Every workspace gets a <strong>public wall URL</strong> — testimoni.io/w/… — no login needed to view. Send it, embed it, QR-code it.",
      "Approve submissions in one click — sales-friendly workflow. Reject anything off-brand.",
      "<strong>Video testimonials</strong> — 1 free on every plan; turn a customer call into a 45-second clip that lives on your page.",
    ],
    cta: "Free plan builds your wall in 30 seconds, no card. Would love your take on whether it fits the way your team works.",
  },
  marketing: {
    hook: "You've been meaning to build a testimonial wall. Here's a shortcut.",
    body: "Testimoni turns any public praise post into a testimonial you can embed. Paste a URL — we pull the author, photo, and text. One line of code drops it on your site.",
    bullets: [
      "<strong>Public Wall of Love URL</strong> free with every workspace — one shareable link that stays fresh as you approve new posts.",
      "One-line embed — Framer, Webflow, WordPress, React, plain HTML. Sub-10KB, no CSS bleed.",
      "<strong>Video testimonials</strong> — 1 free on every plan (unlimited on Pro), 50MB MP4/MOV upload — plays inline on the wall and embed.",
    ],
    cta: "Free plan, no card. Paste-a-tweet is the fastest way in — takes about 30 seconds.",
  },
};

export function pitchEmailHtml(data: PitchEmailData): string {
  const {
    recipientName,
    companyName,
    praiseTweetUrl,
    audience,
    senderName,
    senderEmail,
    landingUrl: rawLandingUrl,
  } = data;

  const landingUrl = withUtm(rawLandingUrl, {
    source: "email",
    medium: "email",
    campaign: `pitch_${audience}`,
    content: "landing_cta",
  });

  const { hook, body, bullets, cta } = HOOK_BY_AUDIENCE[audience];
  const senderFirst = senderName.split(" ")[0];
  const companyLine = companyName
    ? ` Congrats on what you're building at ${escapeHtml(companyName)}.`
    : "";
  const praiseLine = praiseTweetUrl
    ? `\n\n              <p style="margin:0 0 16px 0;">If you want to see it work with a real post: <a href="${escapeAttr(praiseTweetUrl)}" style="color:#5b21b6;text-decoration:underline;">paste this one</a> at ${escapeHtml(landingUrl)} — takes 30 seconds.</p>`
    : "";
  // Bullets carry inline <strong> tags for emphasis (already
  // escaped-safe because we author them), so DON'T pass through
  // escapeHtml. The recipient's data (name, company) is escaped
  // separately.
  const bulletsHtml = bullets
    .map(
      (b) =>
        `<li style="margin-bottom:6px;line-height:1.55;">${b}</li>`,
    )
    .join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Testimoni</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#ffffff;line-height:1px;">
    Testimoni turns any praise tweet into a testimonial in 30 seconds.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="font-size:15px;line-height:1.65;color:#1f2937;">
              <p style="margin:0 0 16px 0;">Hi ${escapeHtml(recipientName)},</p>

              <p style="margin:0 0 16px 0;">${escapeHtml(senderFirst)} here.${companyLine}</p>

              <p style="margin:0 0 16px 0;">${escapeHtml(hook)}</p>

              <p style="margin:0 0 12px 0;">${escapeHtml(body)}</p>

              <ul style="margin:0 0 16px 0;padding-left:22px;font-size:15px;color:#1f2937;">
                ${bulletsHtml}
              </ul>${praiseLine}

              <!-- Primary CTA button. Email-safe pattern: background
                   on the <td>, padding + block display on the <a>.
                   Kept modest (padding 12x22) so it doesn't crash the
                   personal-note tone. -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px 0;">
                <tr>
                  <td style="background-color:#5b21b6;border-radius:8px;">
                    <a href="${escapeAttr(landingUrl)}" target="_blank" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Try it free — 30 seconds &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Bare URL below the button so recipients can see /
                   copy the real link. Some folks always want to
                   verify a URL before clicking, and some just want
                   to paste it into a bio / DM instead of following
                   the button. -->
              <p style="margin:0 0 20px 0;color:#6b7280;font-size:13px;">
                Or copy the link: <a href="${escapeAttr(landingUrl)}" target="_blank" style="color:#5b21b6;text-decoration:underline;">${escapeHtml(landingUrl.replace(/^https?:\/\//, ""))}</a>
              </p>

              <p style="margin:0 0 16px 0;">${escapeHtml(cta)}</p>

              <p style="margin:0 0 4px 0;">— ${escapeHtml(senderFirst)}</p>
              <p style="margin:0;color:#6b7280;font-size:13px;">
                ${escapeHtml(senderName)} · Testimoni ·
                <a href="mailto:${escapeAttr(senderEmail)}" style="color:#6b7280;text-decoration:underline;">${escapeHtml(senderEmail)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

export function pitchEmailSubject(audience: PitchAudience, recipientName: string): string {
  const first = recipientName.split(" ")[0];
  switch (audience) {
    case "founder":
      return `Quick idea for ${first}`;
    case "sales":
      return `Ready-to-share testimonials for ${first}'s team`;
    case "marketing":
      return `A testimonial wall shortcut for ${first}`;
  }
}
