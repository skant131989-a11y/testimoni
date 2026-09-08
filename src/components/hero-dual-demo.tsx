"use client";

import { useState } from "react";
import { Link2, Sparkles } from "lucide-react";
import { TweetPreviewDemo } from "@/components/tweet-preview-demo";
import { ScreenshotDemo } from "@/components/screenshot-demo";
import { TiltCard } from "@/components/tilt-card";
import { track } from "@/lib/analytics";

/**
 * Hero-tab wrapper — switches between the two primary intake demos:
 *   1. Paste a tweet URL → live testimonial preview (existing)
 *   2. Upload a screenshot → auto-extracted testimonial (new, AI)
 *
 * Both are LIVE demos of the two paths new visitors take into
 * testimoni. The tweet demo is the default (proven conversion),
 * screenshot is the new differentiator. Users toggling between
 * them see the full range in one hero.
 *
 * The TweetPreviewDemo keeps its 3D TiltCard treatment because
 * the tilt was already tied to that demo card. The ScreenshotDemo
 * gets its own subtle shadow but no tilt — the auto-playing
 * animation IS its motion, and combining tilt + auto-play looked
 * fussy in testing.
 */

type Tab = "tweet" | "screenshot";

export function HeroDualDemo() {
  const [tab, setTab] = useState<Tab>("tweet");

  function selectTab(next: Tab) {
    if (next === tab) return;
    setTab(next);
    track("hero_tab_switched", { from: tab, to: next }, { anonymous: true });
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Tab switcher — pill-shaped segmented control. Compact,
          visually connected to the demo card below. */}
      <div
        role="tablist"
        aria-label="Choose demo"
        className="mb-4 grid grid-cols-2 gap-1 rounded-full border-2 border-primary/20 bg-primary/[0.03] p-1"
      >
        <button
          role="tab"
          aria-selected={tab === "tweet"}
          onClick={() => selectTab("tweet")}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
            tab === "tweet"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="h-3.5 w-3.5" />
          Paste a tweet
        </button>
        <button
          role="tab"
          aria-selected={tab === "screenshot"}
          onClick={() => selectTab("screenshot")}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
            tab === "screenshot"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Drop a screenshot
        </button>
      </div>

      {/* Panel — one visible at a time. We render both (display:none
          the inactive one) instead of unmounting so the ScreenshotDemo's
          autoplay timer doesn't reset when the user flips tabs.
          Tweet demo also keeps its typed URL between tab switches. */}
      <div className={tab === "tweet" ? "block" : "hidden"}>
        <TiltCard>
          <TweetPreviewDemo />
        </TiltCard>
      </div>
      <div className={tab === "screenshot" ? "block" : "hidden"}>
        <ScreenshotDemo />
      </div>
    </div>
  );
}
