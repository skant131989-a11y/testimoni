"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useCountUp — animates a number from 0 to `target` over `durationMs`.
 * Starts on mount (or when start-toggle flips), uses rAF so it's
 * smooth and idle-friendly. Respects prefers-reduced-motion.
 *
 * @param target      Final value to reach.
 * @param durationMs  Total duration of the tween.
 * @param start       Whether the tween is allowed to run — flip
 *                    false → true to (re)start after mount, e.g. once
 *                    the containing element is in view.
 */
export function useCountUp(
  target: number,
  durationMs: number = 900,
  start: boolean = true,
): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) {
      setValue(0);
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }

    const startAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startAt) / durationMs);
      // easeOutCubic — decelerating tween, feels natural for counters.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, start]);

  return value;
}
