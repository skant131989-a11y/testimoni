"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * Cinematic first-run "provisioning" splash. Renders a full-viewport
 * overlay that rotates through workspace-setup steps, then fades out
 * to reveal the actual welcome page.
 *
 * Reality: by the time the user lands here, everything's already
 * provisioned. But without this splash, they see the paste form
 * cold and read the page as static. The rotating text gives their
 * brain the "wow, they set this up fast" story that a real signup
 * moment deserves. Same pattern Notion, Linear, Loom use.
 *
 * Total time: 4 steps × ~700ms = ~2.8s. Then fade + reveal.
 * If the user is NOT a new signup (returning, mid-flow), splash
 * skips entirely.
 */
const STEPS = [
  "Creating your workspace…",
  "Spinning up your collection form…",
  "Building your first widget…",
  "Preparing your Wall of Love URL…",
];

interface Props {
  /** From /welcome/page.tsx — true if the auth user was created
   *  in the last 90 seconds. Only new signups get the splash. */
  active: boolean;
}

export function WelcomeSplash({ active }: Props) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    // Advance one step every ~700ms. On the last step's tick, fade
    // out — the reveal is a CSS transition, not a hard swap.
    const t = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= STEPS.length) {
          clearInterval(t);
          // Give the last step ~500ms of read time before fading.
          setTimeout(() => setVisible(false), 500);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto max-w-lg px-6 text-center">
        {/* Pulsing sparkle badge — matches the H1 icon on the
            welcome page so the transition feels continuous when
            the splash fades out. */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 animate-pulse text-primary" />
        </div>

        <p className="mt-8 text-lg font-semibold text-foreground min-h-[1.75rem]">
          {STEPS[step]}
        </p>

        {/* Progress dots — one filled dot per completed step. Visual
            confirmation that things are moving even during the
            700ms lulls. */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-primary/20"
              }`}
            />
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Setting up your workspace — 2 seconds.
        </p>
      </div>
    </div>
  );
}
