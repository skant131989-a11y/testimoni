"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin purple progress bar at the top of the viewport, shown during
 * client-side route transitions. Provides the "something is happening"
 * feedback users expect from GitHub / YouTube / Vercel Dashboard —
 * without which clicks feel dead for the 500ms-2s while the server
 * component streams.
 *
 * Implementation:
 * - Listen to pathname changes via usePathname
 * - Start bar at 0 immediately, jump to 80% while page loads, hit
 *   100% and fade when pathname finally settles
 * - Uses a global click handler on <a href> so the bar starts
 *   BEFORE Next.js begins the transition — no lag at click time
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Start bar on link click (before Next.js commits to navigation)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (anchor.target === "_blank") return;
      // External link: skip
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return;
      } catch {
        return;
      }
      setVisible(true);
      setProgress(15);
      // Trickle up to 80% while we wait for the pathname change
      const t1 = setTimeout(() => setProgress(45), 100);
      const t2 = setTimeout(() => setProgress(70), 300);
      const t3 = setTimeout(() => setProgress(85), 800);
      // Store timers so pathname change effect can clear them
      trickleTimers = [t1, t2, t3];
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Complete bar when pathname actually changes
  useEffect(() => {
    if (!visible) return;
    trickleTimers.forEach((t) => clearTimeout(t));
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5 bg-transparent"
      aria-hidden
    >
      <div
        style={{
          width: `${progress}%`,
          transition:
            progress === 100
              ? "width 200ms ease-out, opacity 200ms ease-out 150ms"
              : "width 400ms ease-out",
          opacity: progress === 100 ? 0 : 1,
        }}
        className="h-full bg-primary shadow-[0_0_8px_rgba(91,33,182,0.6)]"
      />
    </div>
  );
}

// Module-level timer refs so the click handler can share state with
// the pathname-change effect. Simpler than useRef when we don't need
// per-instance isolation (there's only one bar in the tree).
let trickleTimers: ReturnType<typeof setTimeout>[] = [];
