/**
 * Delivery email for a paid "Find + Understand" scan unlock.
 * Plain-note style, matching src/lib/emails/tool-delivery.ts — the
 * job is to get the buyer back to their report, not to sell harder.
 */

export type ScanReportTierLabel = "QUICK" | "DEEP";

const TIER_COPY: Record<ScanReportTierLabel, { name: string; body: string }> = {
  QUICK: {
    name: "Quick Scan",
    body: "every mention we found, with the original source link for each.",
  },
  DEEP: {
    name: "Deep Report",
    body: "every mention, the full AI insight breakdown, and an export of the whole thing.",
  },
};

export function scanReportEmailSubject(brand: string, tier: ScanReportTierLabel): string {
  return `Your ${TIER_COPY[tier].name} for ${brand} is ready`;
}

export function scanReportEmailHtml({
  brand,
  reportUrl,
  tier,
}: {
  brand: string;
  reportUrl: string;
  tier: ScanReportTierLabel;
}): string {
  const { name, body } = TIER_COPY[tier];
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
    <p>Hi,</p>
    <p>Your ${name} for <strong>${brand}</strong> is unlocked — ${body}</p>
    <p style="margin: 28px 0;">
      <a href="${reportUrl}" style="background: #7c3aed; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        View your report
      </a>
    </p>
    <p style="color: #666; font-size: 13px;">This link works on any device — no account needed. Keep it somewhere safe if you want to come back to it later.</p>
  </div>`;
}
