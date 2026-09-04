"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * Full-loop demo video — plays silently on load, loops, no controls.
 * Used at the BOTTOM of /demo and /w/demo as reinforcement after the
 * user has already seen an interactive demo or the wall itself.
 *
 * Not used on home page — the interactive TweetPreviewDemo +
 * AnimatedDemo already carry the "watch it work" job there.
 */
interface DemoVideoProps {
  surface: "demo" | "wall_demo";
  caption?: string;
  title?: string;
}

export function DemoVideo({
  surface,
  caption = "Paste a URL → live testimonial. That's the whole loop.",
  title,
}: DemoVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) track("demo_video_unmuted", { surface });
  }

  return (
    <section id="demo-video" className="mx-auto max-w-4xl px-4 py-10">
      {title && (
        <p className="mb-4 text-center text-lg font-semibold text-foreground">
          {title}
        </p>
      )}
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
          onPlay={() => track("demo_video_played", { surface })}
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
        {caption}
      </p>
    </section>
  );
}
