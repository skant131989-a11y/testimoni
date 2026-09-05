/**
 * Star Rating Badge — SVG generator.
 *
 * Shared between:
 *   1. /tools/star-badge — the free public design tool (static preview + download)
 *   2. /badge/[widgetId].svg — the live per-workspace endpoint that
 *      renders using the workspace's real testimonial average
 *   3. The dashboard preview inside a widget's page
 *
 * Kept as a pure function (no React, no browser APIs) so the
 * server-rendered SVG endpoint can call it directly.
 */

export type BadgeStyle = "pill" | "flat" | "minimal";
export type BadgeThemeId = "light" | "dark" | "brand" | "trust";
export type BadgeSizeId = "sm" | "md" | "lg";

export const BADGE_THEMES: Record<
  BadgeThemeId,
  { id: BadgeThemeId; label: string; bg: string; fg: string; muted: string; star: string }
> = {
  light: { id: "light", label: "Light", bg: "#ffffff", fg: "#0f172a", muted: "#64748b", star: "#f59e0b" },
  dark: { id: "dark", label: "Dark", bg: "#0f172a", fg: "#f8fafc", muted: "#94a3b8", star: "#fbbf24" },
  brand: { id: "brand", label: "Brand purple", bg: "#7c3aed", fg: "#ffffff", muted: "#e9d5ff", star: "#facc15" },
  trust: { id: "trust", label: "Trust green", bg: "#059669", fg: "#ffffff", muted: "#a7f3d0", star: "#fef08a" },
};

export const BADGE_SIZES: Record<BadgeSizeId, { id: BadgeSizeId; label: string; scale: number }> = {
  sm: { id: "sm", label: "Small", scale: 0.85 },
  md: { id: "md", label: "Medium", scale: 1.0 },
  lg: { id: "lg", label: "Large", scale: 1.2 },
};

interface BadgeOptions {
  rating: number;
  reviewCount: number;
  businessName?: string;
  style?: BadgeStyle;
  themeId?: BadgeThemeId;
  sizeId?: BadgeSizeId;
}

/**
 * Build the badge SVG as a string.
 *
 * Rendering: horizontal card with 5 stars + rating text + review
 * count. The 5-star row fills proportionally to `rating` (e.g. 4.8
 * = 4 full stars + 80% of the fifth).
 */
export function buildBadgeSvg(opts: BadgeOptions): string {
  const style: BadgeStyle = opts.style ?? "pill";
  const theme = BADGE_THEMES[opts.themeId ?? "light"];
  const scale = BADGE_SIZES[opts.sizeId ?? "md"].scale;
  const rating = opts.rating;
  const reviewCount = opts.reviewCount;
  const businessName = (opts.businessName ?? "").slice(0, 40);

  const clamped = Math.max(1, Math.min(5, rating));
  const fillPct = (clamped / 5) * 100;

  const STAR_PATH =
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

  const baseHeight = style === "minimal" ? 32 : 48;
  const paddingX = style === "minimal" ? 0 : 16;
  const paddingY = style === "minimal" ? 0 : 8;
  const starSize = style === "minimal" ? 24 : 20;
  const gap = 6;
  const textFontSize = 14;
  const smallFontSize = 12;

  const height = Math.round(baseHeight * scale);
  const starPx = Math.round(starSize * scale);
  const gapPx = Math.round(gap * scale);
  const textFont = Math.round(textFontSize * scale);
  const smallFont = Math.round(smallFontSize * scale);
  const padX = Math.round(paddingX * scale);
  const padY = Math.round(paddingY * scale);
  const radius = style === "pill" ? Math.round(height / 2) : style === "flat" ? 8 : 0;

  const starsRowWidth = starPx * 5 + gapPx * 4;

  const ratingText = clamped.toFixed(1);
  const countText = `(${reviewCount.toLocaleString()})`;

  const ratingWidth = Math.round(ratingText.length * textFont * 0.62);
  const countWidth = Math.round(countText.length * smallFont * 0.58);
  const brandWidth = businessName
    ? Math.round(businessName.length * smallFont * 0.58)
    : 0;

  const contentWidth =
    starsRowWidth + gapPx + ratingWidth + (countWidth ? gapPx + countWidth : 0);
  const totalWidth = padX * 2 + Math.max(contentWidth, brandWidth);

  const centerY = height / 2;
  const starY = Math.round(centerY - starPx / 2);
  let cursorX = padX;

  const starsSvg = Array.from({ length: 5 })
    .map((_, i) => {
      const starX = cursorX + (starPx + gapPx) * i;
      const filledFrom = i * 20;
      const starFillPct = Math.max(0, Math.min(100, (fillPct - filledFrom) * 5));
      const clipId = `sb-clip-${i}`;
      return `
        <g transform="translate(${starX} ${starY}) scale(${starPx / 24})">
          <defs>
            <clipPath id="${clipId}"><rect x="0" y="0" width="${(starFillPct / 100) * 24}" height="24"/></clipPath>
          </defs>
          <path d="${STAR_PATH}" fill="${theme.muted}" opacity="0.3"/>
          <path d="${STAR_PATH}" fill="${theme.star}" clip-path="url(#${clipId})"/>
        </g>`;
    })
    .join("");

  cursorX += starsRowWidth + gapPx;

  const ratingSvg = `<text x="${cursorX}" y="${centerY + Math.round(textFont * 0.35)}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${textFont}" font-weight="700" fill="${theme.fg}">${ratingText}</text>`;
  cursorX += ratingWidth + (countWidth ? gapPx : 0);

  const countSvg = countText
    ? `<text x="${cursorX}" y="${centerY + Math.round(smallFont * 0.35)}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${smallFont}" fill="${theme.muted}">${escapeXml(countText)}</text>`
    : "";

  const brandSvg = businessName
    ? `<text x="${totalWidth - padX}" y="${centerY + Math.round(smallFont * 0.35)}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${smallFont}" fill="${theme.muted}">${escapeXml(businessName)}</text>`
    : "";

  const bgRect =
    style === "minimal"
      ? ""
      : `<rect x="0" y="0" width="${totalWidth}" height="${height}" rx="${radius}" ry="${radius}" fill="${theme.bg}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height + Math.max(padY - 4, 0)}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="Rated ${ratingText} out of 5 based on ${reviewCount} reviews">
    ${bgRect}
    ${starsSvg}
    ${ratingSvg}
    ${countSvg}
    ${brandSvg}
  </svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Parse and validate a style query-string value; falls back to
 * "pill". Kept in the shared lib so the SVG endpoint and any
 * future JSON endpoint apply the same normalization.
 */
export function parseBadgeStyle(v: string | null): BadgeStyle {
  return v === "flat" || v === "minimal" ? v : "pill";
}

export function parseBadgeTheme(v: string | null): BadgeThemeId {
  if (v === "dark" || v === "brand" || v === "trust") return v;
  return "light";
}

export function parseBadgeSize(v: string | null): BadgeSizeId {
  if (v === "sm" || v === "lg") return v;
  return "md";
}
