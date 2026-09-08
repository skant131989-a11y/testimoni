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
 * moment deserves.
 *
 * Total time: 3 steps × 400ms + 150ms buffer + 300ms fade ≈ 1.65s
 * (previously ~3.3s). Users complained the welcome page felt slow;
 * shortening the splash was the single biggest perceived-speed win
 * because it was the very first thing they saw post-signup.
 * If the user is NOT a new signup (returning, mid-flow), splash
 * skips entirely.
 */
const STEPS = [
  "Creating your workspace…",
  "Building your form + widget…",
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
    // Advance one step every ~400ms (was 700ms — too slow post-signup,
    // real perceived-slowness culprit). On the last step's tick, fade
    // out — the reveal is a CSS transition, not a hard swap.
    const t = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= STEPS.length) {
          clearInterval(t);
          // Give the last step ~150ms of read time before fading
          // (was 500ms — the whole splash used to burn ~3.3s post-
          // signup which read as "the app is slow" not "wow, quick").
          setTimeout(() => setVisible(false), 150);
          return s;
        }
        return s + 1;
      });
    }, 400);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300 ${
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
          Setting up your workspace — 1 second.
        </p>
      </div>
    </div>
  );
}
