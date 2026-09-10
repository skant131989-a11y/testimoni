"use client";

import { useEffect, useRef, useState } from "react";

interface FadeInProps {
  children: React.ReactNode;
  /** Additional delay before the animation starts. Handy for
   *  staggering siblings without wrapping each one manually. */
  delay?: number;
  className?: string;
  /** How much of the element must be visible before firing.
   *  Default 0.15 gives a gentle "just entered viewport" trigger. */
  threshold?: number;
}

/**
 * Fade + slide-up on scroll wrapper.
 *
 * Wrap any block in <FadeIn> and it will start invisible + shifted
 * down 20px, then transition to its natural position + full opacity
 * when it enters the viewport. Uses IntersectionObserver so it
 * scales to dozens of instances without perf cost.
 *
 * Respects `prefers-reduced-motion` — users who asked the OS to
 * suppress motion see everything already-visible on first paint.
 *
 * The transition uses a spring-like easing (cubic-bezier(0.16, 1,
 * 0.3, 1)) so sections settle in without the mechanical feel of a
 * linear ease. Delay per instance is additive if callers pass a
 * `delay` prop, useful for staggering column cards.
 */
export function FadeIn({
  children,
  delay = 0,
  className = "",
  threshold = 0.15,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Respect the OS-level reduced-motion setting.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        }
      },
      // rootMargin negative-bottom pulls the trigger IN a bit so the
      // fade fires when the section has meaningfully entered view,
      // not the moment its top edge crosses the fold.
      { threshold, rootMargin: "0px 0px -80px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
