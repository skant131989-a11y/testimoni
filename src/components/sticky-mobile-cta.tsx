"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * Fixed bottom pill on mobile only. Appears after the visitor
 * scrolls past the hero, so it never competes with the primary
 * above-fold CTA. Hidden on desktop where the sticky header nav
 * already covers the same job.
 */
interface StickyMobileCtaProps {
  href?: string;
  label?: string;
  source: string;
}

export function StickyMobileCta({
  href = "/signup",
  label = "Start free — 30 seconds",
  source,
}: StickyMobileCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-4 md:hidden">
      <Link
        href={href}
        onClick={() =>
          track("sticky_mobile_cta_clicked", { source }, { instant: true })
        }
        className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
      >
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
