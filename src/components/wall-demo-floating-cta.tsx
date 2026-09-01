"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * Fixed-position "Build your own" pill that appears in the
 * bottom-right corner of /w/demo after the visitor scrolls past the
 * initial fold. Catches curious viewers who read the sample wall and
 * are about to close the tab without any CTA click.
 *
 * Hidden until scroll > 200px so it doesn't compete with the top
 * banner for attention right on load.
 */
export function WallDemoFloatingCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 200);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="/signup?utm_source=wall_demo_floating&utm_medium=hosted&utm_campaign=build_your_own"
      onClick={() => track("wall_demo_floating_cta_click")}
      className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      aria-hidden={!visible}
    >
      Build your own Wall of Love — Free
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}
