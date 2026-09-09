import { withUtm } from "./utm";

export interface WeeklyWallScoreEmailData {
  name: string;
  workspaceName: string;
  score: number;
  delta: number | null;
  topRecommendation: { issue: string; suggestion: string } | null;
  totalTestimonials: number;
  wallScoreUrl: string;
}

/**
 * Weekly Wall Score email — sent every Monday to Pro workspaces
 * with an active AskMyWallConfig (proxy for "engaged enough to
 * want a weekly digest").
 *
 * Email-safe rules match the welcome email — table layout, inline
 * styles, absolute URLs. See src/lib/emails/welcome.ts for the
 * why on each rule.
 */
export function weeklyWallScoreEmailHtml(data: WeeklyWallScoreEmailData): string {
  const { name, workspaceName, score, delta, topRecommendation, totalTestimonials } = data;
  const wallScoreUrl = withUtm(data.wallScoreUrl, {
    source: "email",
    medium: "wall-score-weekly",
    campaign: "wall-score-weekly",
  });

  const grade = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs work" : "Weak";
  const gradeColor = score >= 80 ? "#059669" : score >= 60 ? "#2563eb" : score >= 40 ? "#d97706" : "#dc2626";

  const deltaBlock = delta === null
    ? ""
    : delta > 0
      ? `<div style="margin-top:6px;color:#059669;font-size:14px;font-weight:600;">▲ +${delta} since last week</div>`
      : delta < 0
        ? `<div style="margin-top:6px;color:#dc2626;font-size:14px;font-weight:600;">▼ ${delta} since last week</div>`
        : `<div style="margin-top:6px;color:#6b7280;font-size:14px;">No change since last week</div>`;

  const recoBlock = topRecommendation
    ? `<tr><td style="padding:24px 0 0;">
        <div style="border-left:3px solid #4f46e5;padding:8px 16px;background:#fafafa;">
          <div style="font-weight:600;font-size:14px;color:#18181b;">This week's biggest lift</div>
          <div style="font-size:14px;color:#3f3f46;margin-top:6px;">${escapeHtml(topRecommendation.issue)}</div>
          <div style="font-size:14px;color:#6b7280;margin-top:8px;">${escapeHtml(topRecommendation.suggestion)}</div>
        </div>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Your Wall Score — ${workspaceName}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-size:14px;color:#6b7280;">Weekly Wall Score</div>
          <div style="font-size:22px;color:#18181b;margin-top:4px;font-weight:600;">${escapeHtml(workspaceName)}</div>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;">
          <div style="font-size:64px;font-weight:700;color:#18181b;line-height:1;">${score}<span style="font-size:24px;color:#6b7280;font-weight:400;">/100</span></div>
          <div style="font-size:18px;font-weight:600;color:${gradeColor};margin-top:6px;">${grade}</div>
          ${deltaBlock}
        </td></tr>
        <tr><td style="padding:0 32px 8px;">
          <div style="font-size:13px;color:#6b7280;">Based on ${totalTestimonials} approved testimonial${totalTestimonials === 1 ? "" : "s"}.</div>
        </td></tr>
        ${recoBlock}
        <tr><td style="padding:24px 32px 32px;">
          <a href="${wallScoreUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View full breakdown →</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #eee;">
          <div style="font-size:12px;color:#a1a1aa;">
            You're receiving this because Ask My Wall is active on your workspace.
            <br>Hi ${escapeHtml(name)} · Testimoni
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function weeklyWallScoreEmailSubject(score: number, delta: number | null): string {
  if (delta !== null && delta > 0) return `Wall Score: ${score}/100 (▲ +${delta} this week)`;
  if (delta !== null && delta < 0) return `Wall Score: ${score}/100 (▼ ${delta} this week)`;
  return `Wall Score: ${score}/100`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
