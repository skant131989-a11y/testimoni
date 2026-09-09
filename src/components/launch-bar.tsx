"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * Slim announcement bar for launch-week moments — sits above the
 * sticky nav so every home-page visitor sees it once. Dismissable,
 * and the dismissal persists in localStorage so returning visitors
 * aren't nagged.
 *
 * The `id` prop keys the dismissal so a future launch can reuse
 * this component with a different message and get a fresh chance
 * to interrupt. Bump the id when the copy changes.
 *
 * Renders NOTHING until mount so the SSR HTML stays stable — this
 * avoids a hydration mismatch when localStorage says "dismissed"
 * but the server rendered the bar open.
 */
export function LaunchBar({
  id,
  href,
  message,
  cta,
}: {
  id: string;
  href: string;
  message: string;
  cta: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(`launch-bar-${id}`) === "1");
    } catch {
      setDismissed(false);
    }
  }, [id]);

  if (!mounted || dismissed) return null;

  const onDismiss = () => {
    try {
      localStorage.setItem(`launch-bar-${id}`, "1");
    } catch {}
    setDismissed(true);
    track("launch_bar_dismissed", { id });
  };

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    track("launch_bar_clicked", { id });
    // If the href is a same-page anchor, scroll manually and keep
    // the URL clean — otherwise clicking would leave `#anchor` in
    // the address bar, which then survives refresh + scrolls the
    // page to the anchor every reload. Not what we want for a
    // launch-bar CTA.
    if (href.startsWith("#")) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-primary via-purple-600 to-primary text-primary-foreground">
      <a
        href={href}
        onClick={onClick}
        className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-10 py-2.5 text-sm font-medium hover:opacity-90"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">
          <span className="mr-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            New
          </span>
          {message}
        </span>
        <span className="sm:hidden">{message}</span>
        <span className="inline-flex items-center gap-0.5 font-semibold underline-offset-4 hover:underline">
          {cta} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </a>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={onDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
