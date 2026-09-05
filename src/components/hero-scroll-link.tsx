"use client";

import { track } from "@/lib/analytics";

/**
 * Anchor-style link that scrolls to a section id without leaving a
 * sticky hash in the URL.
 *
 * Why not <a href="#foo">? After the first click, the browser sets
 * the URL to #foo and treats subsequent clicks as no-ops (already
 * at anchor). We scroll programmatically and clear the hash after
 * the animation so every click works.
 */
export function HeroScrollLink({
  targetId,
  cta,
  surface,
  children,
  className = "",
}: {
  targetId: string;
  cta: string;
  surface: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        track(cta, { surface });
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        // Clear the URL hash after the smooth-scroll animation so
        // the next click still re-triggers the scroll. Preserves
        // pathname + query.
        setTimeout(() => {
          try {
            history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search,
            );
          } catch {}
        }, 900);
      }}
      className={`cursor-pointer border-0 bg-transparent p-0 ${className}`}
    >
      {children}
    </button>
  );
}
