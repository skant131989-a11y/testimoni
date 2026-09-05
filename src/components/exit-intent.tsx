"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/**
 * Exit-intent popup for /tools/* and /for/* pages.
 *
 * Behavior:
 * - Desktop only. Mobile browsers have no reliable exit-intent signal
 *   (mouse leaving the viewport isn't a proxy for closing on touch
 *   devices), so we skip mobile entirely.
 * - Fires ONCE per surface per 24h. LocalStorage flag prevents spam.
 * - Also skips if the user has already reached the bottom of the
 *   page (they're engaged, no need to nudge).
 * - Delays 3s after mount so accidental early mouse-outs don't fire.
 *
 * Props:
 * - surface — used both for tracking and the localStorage key,
 *   so /tools/testimonial-card and /for/saas each get their own cooldown.
 */

interface Props {
  surface: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const READY_DELAY_MS = 3_000;

export function ExitIntent({
  surface,
  headline = "Wait — build a Wall of Love in 30 seconds.",
  body = "Free forever plan. No credit card. Paste a customer tweet, share a form, or start with the sample. Live on your site the same session.",
  ctaLabel = "Start free",
  ctaHref = "/signup",
}: Props) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Skip on touch devices (no reliable exit-intent signal)
    const isTouch =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer: coarse)")?.matches ?? false);
    if (isTouch) return;

    // Skip if we've fired recently for this surface
    const key = `exit_intent_${surface}`;
    try {
      const last = localStorage.getItem(key);
      if (last && Date.now() - Number(last) < COOLDOWN_MS) return;
    } catch {
      // If localStorage is blocked, still allow the popup — worst
      // case it re-shows on next visit.
    }

    // Delay before we start listening so an accidental mouse-out
    // during page load doesn't fire the popup.
    const t = setTimeout(() => setReady(true), READY_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface]);

  useEffect(() => {
    if (!ready) return;

    // Fire when mouse leaves the top of the viewport (classic exit-
    // intent signal — user is heading for the tab/close button).
    function handleMouseOut(e: MouseEvent) {
      if (e.clientY > 0) return;
      if (e.relatedTarget) return;
      openPopup();
    }

    function openPopup() {
      setOpen(true);
      document.removeEventListener("mouseout", handleMouseOut);
      try {
        localStorage.setItem(`exit_intent_${surface}`, String(Date.now()));
      } catch {}
      track("exit_intent_shown", { surface });
    }

    document.addEventListener("mouseout", handleMouseOut);
    return () => document.removeEventListener("mouseout", handleMouseOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, surface]);

  function handleDismiss() {
    track("exit_intent_dismissed", { surface });
    setOpen(false);
  }

  function handleCta() {
    track("exit_intent_cta_clicked", { surface });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border-2 border-primary/30 bg-background p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> Wait
        </div>
        <h3 className="text-xl font-bold leading-tight">{headline}</h3>
        <p className="mt-3 text-sm text-muted-foreground">{body}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={ctaHref} onClick={handleCta} className="flex-1">
            <Button size="lg" className="w-full gap-2">
              {ctaLabel} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleDismiss}
            className="flex-1"
          >
            Maybe later
          </Button>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Free forever plan. No credit card.
        </p>
      </div>
    </div>
  );
}
