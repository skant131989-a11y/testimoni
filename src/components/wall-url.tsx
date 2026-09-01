"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Copy, Code, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

interface WallUrlProps {
  widgetId: string;
  /** Absolute or relative wall URL. Absolute preferred so Copy gets the
   *  full shareable link. */
  wallUrl: string;
  /** Surface for analytics — "dashboard", "testimonials", "sidebar", "inbox_empty", etc. */
  surface: string;
  /** Optional customer-name preview strip. When provided, the card
   *  variant renders 3 tiny avatars alongside the URL for visual
   *  reinforcement. */
  previewNames?: string[];
}

/**
 * Big variant. Meant for the top of /dashboard — the "come home"
 * screen. Shows URL + three action buttons + optional preview strip.
 *
 * The wall URL is the product's #1 shareable asset. This card makes
 * it findable on the primary screen every user visits.
 */
export function WallUrlCard({ widgetId, wallUrl, surface, previewNames }: WallUrlProps) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(wallUrl);
      setCopied(true);
      track("wall_url_copied", { surface });
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Your Wall of Love
            </p>
          </div>
          <a
            href={wallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block truncate font-mono text-sm text-foreground hover:text-primary hover:underline md:text-base"
            onClick={() => track("wall_view_clicked", { surface, via: "url_text" })}
          >
            {wallUrl}
          </a>
          <p className="mt-1 text-xs text-muted-foreground">
            Public URL — share in bios, DMs, or a QR code. No signup needed to view.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:shrink-0">
          <Button asChild size="sm">
            <a
              href={wallUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("wall_view_clicked", { surface, via: "button" })}
            >
              View wall <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={copyUrl}>
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy URL
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/dashboard/widgets/${widgetId}/embed`}
              onClick={() => track("wall_embed_clicked", { surface })}
            >
              <Code className="mr-1.5 h-3.5 w-3.5" /> Embed
            </Link>
          </Button>
        </div>
      </div>

      {previewNames && previewNames.length > 0 && (
        <div className="mt-4 flex items-center gap-2 border-t border-primary/10 pt-3">
          <div className="flex -space-x-2">
            {previewNames.slice(0, 3).map((name) => {
              const letter = name.charAt(0).toUpperCase();
              return (
                <div
                  key={name}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary/15 text-[10px] font-bold text-primary"
                  title={name}
                >
                  {letter}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Featuring {previewNames.slice(0, 3).join(", ")}
            {previewNames.length > 3 && ` and ${previewNames.length - 3} more`}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant. Meant for the top of secondary pages
 * (/testimonials, /import, /analytics, etc.) — one-line reminder of
 * the wall URL without dominating the layout.
 */
export function WallUrlBanner({ widgetId, wallUrl, surface }: WallUrlProps) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(wallUrl);
      setCopied(true);
      track("wall_url_copied", { surface });
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-primary">
          Wall of Love
        </span>
        <a
          href={wallUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 truncate font-mono text-xs text-muted-foreground hover:text-primary hover:underline sm:text-sm"
          onClick={() => track("wall_view_clicked", { surface, via: "url_text" })}
        >
          {wallUrl}
        </a>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button asChild size="sm" variant="ghost">
          <a
            href={wallUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("wall_view_clicked", { surface, via: "button" })}
          >
            View <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
        <Button variant="ghost" size="sm" onClick={copyUrl}>
          {copied ? (
            <>
              <Check className="mr-1 h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" /> Copy
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link
            href={`/dashboard/widgets/${widgetId}/embed`}
            onClick={() => track("wall_embed_clicked", { surface })}
          >
            <Code className="mr-1 h-3 w-3" /> Embed
          </Link>
        </Button>
      </div>
    </div>
  );
}
