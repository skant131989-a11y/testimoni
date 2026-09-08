"use client";

import { useEffect, useState } from "react";
import { HOME_PRAISE, pickDailyPraise } from "@/lib/home-praise";

/**
 * "Loved by founders" strip — auto-rotates through the hand-curated
 * real-testimonial pool. First quote is the deterministic per-UTC-
 * day pick (see pickDailyPraise), so the strip is stable on first
 * paint and doesn't hydration-mismatch. After mount, we rotate to
 * the next quote every 6 seconds with a subtle slide + fade
 * transition — the page feels alive, users can't scroll past
 * without noticing.
 *
 * Two clickable regions (nested <a> is invalid HTML):
 *   - Left (pill + quote + author) opens the source tweet
 *   - Right ("See all praise →") opens the Wall of Love
 *
 * Client component now — needs setInterval + transition state.
 * Was a server component before the rotation; kept the same JSX
 * shell so styling / SSR position is unchanged.
 */
export function LovedByFoundersStrip() {
  const initial = pickDailyPraise();
  const initialIdx = HOME_PRAISE.findIndex(
    (p) => p.sourceUrl === initial.sourceUrl
  );
  const [index, setIndex] = useState(initialIdx >= 0 ? initialIdx : 0);
  // Slide direction — used for the enter animation. Always "in from
  // right" while auto-rotating, so keep it a constant.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      // Fade the current quote OUT, swap the index, fade IN. The
      // 250ms out matches the CSS transition on opacity below.
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % HOME_PRAISE.length);
        setVisible(true);
      }, 250);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const praise = HOME_PRAISE[index];

  return (
    <section className="border-b bg-muted/20 py-6">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm sm:flex-row">
          <a
            href={praise.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-1 flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
          >
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              Loved by founders
            </span>
            <blockquote
              className={`min-w-0 flex-1 text-sm italic text-foreground line-clamp-3 transition-all duration-300 sm:text-base sm:line-clamp-2 ${
                visible ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
              }`}
            >
              &ldquo;{praise.content}&rdquo;
            </blockquote>
            <span
              className={`shrink-0 text-xs text-muted-foreground transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
              }`}
            >
              — {praise.customerName}
            </span>
          </a>
          <a
            href={praise.wallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex shrink-0 items-center justify-center gap-1.5 border-t border-border bg-primary/5 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 sm:border-l sm:border-t-0 sm:py-4"
          >
            See all praise
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
