"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * Home-page demo video — plays silently on load, loops, no controls.
 * A tap on mobile unmutes/plays (some browsers gate autoplay on
 * cellular). Anchored at #demo-video so /w/demo can jump to it.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) track("hero_video_unmuted", { surface: "home" });
  }

  return (
    <section id="demo-video" className="mx-auto max-w-4xl px-4 pb-4">
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-black shadow-xl">
        <video
          ref={ref}
          src="/hero-demo.mp4"
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
          className="block w-full"
          onPlay={() => track("hero_video_played", { surface: "home" })}
        />
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Unmute demo" : "Mute demo"}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/85"
        >
          <Play className="h-3 w-3" />
          {muted ? "Tap for sound" : "Mute"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Paste a URL → live testimonial. That&apos;s the whole loop.
      </p>
    </section>
  );
}
