"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * HeroScrollHint — small floating chip at the bottom of the hero
 * that signals "there's more below" to Mac users whose viewport
 * exactly fits the hero. Bounces gently, scrolls to Section 2 on
 * click, and auto-fades out once the user has scrolled far enough
 * to have seen the next section themselves.
 *
 * ── Behavior ─────────────────────────────────────────────────────
 * - Mounts hidden. Fades in after `revealDelayMs` (default 1600ms)
 *   so it doesn't add noise at first paint.
 * - Hides again once window.scrollY exceeds `hideAfterPx` (default
 *   240px) — the user is now looking at Section 2, they got the
 *   message.
 * - Click / Enter → smooth-scrolls to #drop-link (Section 2).
 * - Analytics: `hero_scroll_hint_click` with the resolved target.
 */

interface Props {
  targetId?: string;
  label?: string;
  revealDelayMs?: number;
  hideAfterPx?: number;
}

export function HeroScrollHint({
  targetId = "drop-link",
  label = "Try it live: tweet · screenshot · App Store",
  revealDelayMs = 1600,
  hideAfterPx = 240,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), revealDelayMs);
    const onScroll = () => {
      if (window.scrollY > hideAfterPx) setVisible(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [revealDelayMs, hideAfterPx]);

  function goToTarget() {
    track("hero_scroll_hint_click", { target: targetId });

    // Ask HeroDualDemo to switch to the "paste tweet" tab if it
    // isn't already. Fires as a custom window event so we don't
    // need a ref or shared state — HeroDualDemo listens for this.
    try {
      window.dispatchEvent(
        new CustomEvent("hero-demo-select-tab", { detail: "tweet" }),
      );
    } catch {}

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
    }

    // After the smooth-scroll settles (~700ms is typical), focus the
    // tweet input in HeroDualDemo. preventScroll:true so focus
    // doesn't jump the page and undo the scroll we just did.
    setTimeout(() => {
      const input = document.getElementById("hero-demo-tweet-input");
      if (input instanceof HTMLInputElement) {
        input.focus({ preventScroll: true });
        track("hero_scroll_hint_focus_success", { target: targetId });
      }
    }, 700);
  }

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-30 flex justify-center transition-all duration-500 ${
        visible
          ? "bottom-6 opacity-100"
          : "bottom-0 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        onClick={goToTarget}
        className={`pointer-events-auto inline-flex items-center gap-2 rounded-full border border-violet-300/70 bg-white/95 px-4 py-2 text-sm font-semibold text-violet-700 shadow-lg shadow-violet-500/20 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-violet-500 hover:shadow-xl ${
          visible ? "animate-hero-scroll-hint" : ""
        }`}
      >
        <ChevronDown className="h-4 w-4" />
        <span>{label}</span>
      </button>
    </div>
  );
}
