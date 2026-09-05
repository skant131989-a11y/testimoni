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
import { ToolsHeader } from "@/components/tools-header";
import { ToolSignupUpsell } from "@/components/tool-signup-upsell";
import { buildBadgeSvg, BADGE_THEMES, BADGE_SIZES, type BadgeStyle, type BadgeThemeId, type BadgeSizeId } from "@/lib/badge-svg";

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
  { id: "pill" as BadgeStyle, label: "Pill (rounded)" },
  { id: "flat" as BadgeStyle, label: "Flat (rectangle)" },
  { id: "minimal" as BadgeStyle, label: "Minimal (just stars)" },
] as const;

const THEMES = Object.values(BADGE_THEMES);
const SIZES = Object.values(BADGE_SIZES);

export function StarBadgeClient() {
  const [rating, setRating] = useState(4.8);
  const [reviewCount, setReviewCount] = useState(132);
  const [businessName, setBusinessName] = useState("");
  const [styleId, setStyleId] = useState<BadgeStyle>("pill");
  const [themeId, setThemeId] = useState<BadgeThemeId>("light");
  const [sizeId, setSizeId] = useState<BadgeSizeId>("md");
  const [copied, setCopied] = useState(false);

  const svgString = useMemo(
    () =>
      buildBadgeSvg({
        rating,
        reviewCount,
        businessName,
        style: styleId,
        themeId,
        sizeId,
      }),
    [rating, reviewCount, businessName, styleId, themeId, sizeId]
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
      <ToolsHeader backToTools />

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
        <div className="mx-auto max-w-3xl">
          <ToolSignupUpsell
            tool="star-badge"
            badge="Signed up? Get it live."
            headline="Show your real average — auto-updating."
            description={
              <>
                With a free Testimoni account, this badge pulls your actual
                testimonial rating and count automatically. Collect testimonials,
                and the badge updates itself.
              </>
            }
          />
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

