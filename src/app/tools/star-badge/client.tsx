"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { ExitIntent } from "@/components/exit-intent";

/**
 * Star Rating Badge generator.
 *
 * Pure client-side SVG builder — no backend. Users configure the
 * badge (rating, review count, style, colors) and get:
 *   1. Download SVG file
 *   2. Copy embedable HTML snippet with the SVG inlined
 *
 * Signed-in users will (future work) get a dynamic embed:
 *   <script src="testimoni.io/badge.js" data-widget="...">
 * that reads live testimonial averages. For now the tool ships
 * static badge output.
 */

const STYLES = [
  { id: "pill", label: "Pill (rounded)" },
  { id: "flat", label: "Flat (rectangle)" },
  { id: "minimal", label: "Minimal (just stars)" },
] as const;

const THEMES = [
  { id: "light", label: "Light", bg: "#ffffff", fg: "#0f172a", muted: "#64748b", star: "#f59e0b" },
  { id: "dark", label: "Dark", bg: "#0f172a", fg: "#f8fafc", muted: "#94a3b8", star: "#fbbf24" },
  { id: "brand", label: "Brand purple", bg: "#7c3aed", fg: "#ffffff", muted: "#e9d5ff", star: "#facc15" },
  { id: "trust", label: "Trust green", bg: "#059669", fg: "#ffffff", muted: "#a7f3d0", star: "#fef08a" },
] as const;

const SIZES = [
  { id: "sm", label: "Small", scale: 0.85 },
  { id: "md", label: "Medium", scale: 1.0 },
  { id: "lg", label: "Large", scale: 1.2 },
] as const;

export function StarBadgeClient() {
  const [rating, setRating] = useState(4.8);
  const [reviewCount, setReviewCount] = useState(132);
  const [businessName, setBusinessName] = useState("");
  const [styleId, setStyleId] = useState<typeof STYLES[number]["id"]>("pill");
  const [themeId, setThemeId] = useState<typeof THEMES[number]["id"]>("light");
  const [sizeId, setSizeId] = useState<typeof SIZES[number]["id"]>("md");
  const [copied, setCopied] = useState(false);

  const theme = THEMES.find((t) => t.id === themeId)!;
  const size = SIZES.find((s) => s.id === sizeId)!;

  const svgString = useMemo(
    () =>
      buildBadgeSvg({
        rating,
        reviewCount,
        businessName,
        style: styleId,
        theme,
        scale: size.scale,
      }),
    [rating, reviewCount, businessName, styleId, theme, size.scale]
  );

  const embedSnippet = useMemo(
    () =>
      `<!-- Testimoni star badge -->\n<a href="https://testimoni.io" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none;">\n${svgString}\n</a>`,
    [svgString]
  );

  function handleDownload() {
    track("star_badge_download_clicked", {
      style: styleId,
      theme: themeId,
      rating,
    });
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `star-badge-${themeId}-${styleId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyEmbed() {
    track("star_badge_copy_embed_clicked", { style: styleId, theme: themeId });
    await navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="Testimoni logo" width={28} height={28} className="rounded-full" />
            <span className="text-xl font-bold">Testimoni</span>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Free · No signup
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Star rating badge for your website.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Instant credibility. Paste in your footer, product pages, or email
            signature. Design it, download SVG, or copy the embed code.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Editor panel */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rating" className="text-sm font-semibold">Rating</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Math.min(5, Math.max(1, Number(e.target.value) || 5)))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="count" className="text-sm font-semibold">Review count</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  value={reviewCount}
                  onChange={(e) => setReviewCount(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="brand" className="text-sm font-semibold">Business name <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input
                id="brand"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Studio"
                className="mt-1.5"
                maxLength={40}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Style</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyleId(s.id)}
                    className={`rounded-lg border-2 px-2 py-1.5 text-xs font-medium ${
                      styleId === s.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Theme</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeId(t.id)}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium ${
                      themeId === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Size</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizeId(s.id)}
                    className={`rounded-lg border-2 px-2 py-1.5 text-xs font-medium ${
                      sizeId === s.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleDownload} size="lg" className="w-full gap-2">
                <Download className="h-4 w-4" /> Download SVG
              </Button>
              <Button onClick={handleCopyEmbed} variant="outline" size="lg" className="w-full gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy embed code"}
              </Button>
            </div>
          </div>

          {/* Preview panel */}
          <div className="min-w-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
            <div className="rounded-xl border bg-muted/30 p-8 text-center">
              <div
                className="mx-auto"
                dangerouslySetInnerHTML={{ __html: svgString }}
              />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Embed code</p>
              <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
                <code>{embedSnippet}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Signup upsell */}
        <div className="mx-auto mt-16 max-w-3xl rounded-2xl border-2 border-primary/30 bg-primary/5 p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Signed up? Get it live.
              </div>
              <h2 className="text-2xl font-bold">
                Show your real average — auto-updating.
              </h2>
              <p className="mt-2 text-muted-foreground">
                With a free Testimoni account, this badge pulls your actual
                testimonial rating and count automatically. Collect testimonials,
                and the badge updates itself.
              </p>
            </div>
            <Link href="/signup?tool=star-badge">
              <Button size="lg" className="gap-2">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to Testimoni
          </Link>
          <p>Free tool. No signup needed.</p>
        </div>
      </footer>

      <ExitIntent surface="tools_star_badge" />
    </div>
  );
}

/**
 * Build the badge SVG as a string. Kept as a pure function so the
 * same output ships in three places: the live preview, the
 * downloaded .svg file, and the copy-embed snippet.
 *
 * Rendering: horizontal card with 5 stars + rating text + review
 * count. The 5-star row fills proportionally to `rating` (e.g. 4.8
 * = 4 full stars + 80% of the fifth).
 */
function buildBadgeSvg(opts: {
  rating: number;
  reviewCount: number;
  businessName: string;
  style: "pill" | "flat" | "minimal";
  theme: { bg: string; fg: string; muted: string; star: string };
  scale: number;
}): string {
  const { rating, reviewCount, businessName, style, theme, scale } = opts;

  const clamped = Math.max(1, Math.min(5, rating));
  const fillPct = (clamped / 5) * 100;

  const STAR_PATH =
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

  // Base sizes (scaled by `scale`)
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

  // Stars row width
  const starsRowWidth = starPx * 5 + gapPx * 4;

  // Text
  const ratingText = `${clamped.toFixed(1)}`;
  const countText = `(${reviewCount.toLocaleString()})`;

  // Approx text width for layout
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
  const contentX = padX;
  let cursorX = contentX;

  // Build 5 stars: each rendered as a rect-clipped fill on top of a
  // muted outline. This lets a fractional star (e.g. 4.8) render as
  // a partially-filled last star.
  const starsSvg = Array.from({ length: 5 })
    .map((_, i) => {
      const starX = cursorX + (starPx + gapPx) * i;
      // Fraction filled for THIS star
      const filledFrom = i * 20; // 0, 20, 40, 60, 80
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

  // Final SVG. Includes xmlns for standalone use in files/embeds.
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
