"use client";

import { useEffect, useState } from "react";
import { Globe, Link2, Sparkles, Store } from "lucide-react";
import { TweetPreviewDemo } from "@/components/tweet-preview-demo";
import { ScreenshotDemo } from "@/components/screenshot-demo";
import { AppStoreDemo } from "@/components/app-store-demo";
import { WebsiteScanDemo } from "@/components/website-scan-demo";
import { TiltCard } from "@/components/tilt-card";
import { track } from "@/lib/analytics";

/**
 * Hero-tab wrapper — switches between the four primary intake demos:
 *   1. Paste a tweet URL       → live testimonial preview
 *   2. Scan a website          → opens the Customer Voice scan
 *   3. Upload a screenshot     → AI-extracted testimonial
 *   4. Import App Store review → animated stack of star-rated cards
 *
 * All three are LIVE demos of Testimoni's intake paths. Tweet is
 * the default (proven conversion). Screenshot is the AI wow moment.
 * App Store is the newest — Free plan can now import from every
 * review platform, and this demo shows visitors what that looks
 * like the moment they land.
 *
 * The TweetPreviewDemo keeps its 3D TiltCard treatment because the
 * tilt is tied to that specific card. The auto-playing demos
 * (Screenshot + AppStore) don't get tilt — combining tilt +
 * auto-play looked fussy in testing.
 *
 * Kept the name `HeroDualDemo` even though it's now triple; the
 * existing imports on /page.tsx and /demo/demo-client.tsx would
 * churn for no reason on a rename, and the component's
 * responsibility ("hero-slot intake demo") hasn't changed.
 */

type Tab = "tweet" | "website" | "screenshot" | "app_store";

// Short labels for phones (four tabs in ~340px), long labels from sm up.
const TABS: { id: Tab; Icon: typeof Link2; short: string; long: string }[] = [
  { id: "tweet", Icon: Link2, short: "Tweet", long: "Paste tweet" },
  { id: "website", Icon: Globe, short: "Website", long: "Scan website" },
  { id: "screenshot", Icon: Sparkles, short: "Screenshot", long: "Drop screenshot" },
  { id: "app_store", Icon: Store, short: "App Store", long: "App Store" },
];

export function HeroDualDemo() {
  const [tab, setTab] = useState<Tab>("tweet");

  function selectTab(next: Tab) {
    if (next === tab) return;
    setTab(next);
    track("hero_tab_switched", { from: tab, to: next }, { anonymous: true });
  }

  // Listen for cross-component tab-switch requests. Fired by the
  // hero scroll-hint chip when it needs to route the user into the
  // "paste tweet" flow specifically. Uses a custom window event so
  // callers don't need a ref or context.
  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent<Tab>).detail;
      if (next && next !== tab) {
        setTab(next);
      }
    };
    window.addEventListener("hero-demo-select-tab", handler as EventListener);
    return () => {
      window.removeEventListener(
        "hero-demo-select-tab",
        handler as EventListener,
      );
    };
  }, [tab]);

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Tab switcher — 3-way pill. Compact copy on mobile so all
          three labels fit without wrapping. Icons hide below 380px
          via `xs:` breakpoint substitute (icon + hidden text). */}
      <div
        role="tablist"
        aria-label="Choose demo"
        className="mb-4 grid grid-cols-4 gap-1 rounded-full border-2 border-primary/20 bg-primary/[0.03] p-1"
      >
        {TABS.map(({ id, Icon, short, long }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => selectTab(id)}
            className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full px-1.5 py-1.5 text-[11px] font-semibold transition-all sm:px-2 sm:text-xs ${
              tab === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="hidden h-3.5 w-3.5 sm:block" />
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{long}</span>
          </button>
        ))}
      </div>

      {/* Panels — render all three (display:none the inactive ones)
          so the autoplay timers in Screenshot + AppStore don't reset
          when the user flips tabs. */}
      <div className={tab === "tweet" ? "block" : "hidden"}>
        <TiltCard>
          <TweetPreviewDemo />
        </TiltCard>
      </div>
      <div className={tab === "website" ? "block" : "hidden"}>
        <WebsiteScanDemo />
      </div>
      <div className={tab === "screenshot" ? "block" : "hidden"}>
        <ScreenshotDemo />
      </div>
      <div className={tab === "app_store" ? "block" : "hidden"}>
        <AppStoreDemo />
      </div>
    </div>
  );
}
