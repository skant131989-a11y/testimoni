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
  /** Entrance direction. Defaults to "up" (slide up). Use "left" or
   *  "right" for sideways slides, "scale" for a pure scale-in. */
  from?: "up" | "left" | "right" | "scale";
  /** Distance of the slide in pixels. Default 40 — bigger than the
   *  old 20 so the motion is felt, not just glimpsed. */
  distance?: number;
}

/**
 * Fade + slide-in on scroll wrapper.
 *
 * Wrap any block in <FadeIn> and it will start invisible + shifted
 * with a slight scale-down, then transition to its natural position
 * + full opacity when it enters the viewport. Uses IntersectionObserver
 * so it scales to dozens of instances without perf cost.
 *
 * Respects `prefers-reduced-motion` — users who asked the OS to
 * suppress motion see everything already-visible on first paint.
 *
 * The transition uses a spring-like overshoot easing (cubic-bezier
 * that peaks above 1.0 briefly) so sections settle in with a beat
 * of bounce instead of a lifeless linear ease. Delay per instance
 * is additive if callers pass a `delay` prop, useful for staggering
 * column cards.
 */
export function FadeIn({
  children,
  delay = 0,
  className = "",
  threshold = 0.15,
  from = "up",
  distance = 40,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  // Compute the initial transform based on `from`.
  const initialTransform =
    from === "up"
      ? `translate3d(0, ${distance}px, 0) scale(0.96)`
      : from === "left"
        ? `translate3d(-${distance}px, 0, 0) scale(0.96)`
        : from === "right"
          ? `translate3d(${distance}px, 0, 0) scale(0.96)`
          : "scale(0.92)";

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0, 0, 0) scale(1)" : initialTransform,
        // Springy overshoot easing — feels alive vs the standard
        // 0.16, 1, 0.3, 1 glass-slide. Small overshoot around 1.05
        // then settles.
        transition: `opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms, transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Wraps a set of siblings so they cascade in with a stagger delay.
 * Under the hood each child gets a <FadeIn> with an incrementing
 * `delay`. Use for grids of cards you want to feel like they're
 * being collected in real time.
 *
 * Usage:
 *   <FadeInStagger step={110}>
 *     <Card />
 *     <Card />
 *     <Card />
 *   </FadeInStagger>
 */
interface FadeInStaggerProps {
  children: React.ReactNode;
  /** Milliseconds between each child's entrance. Default 100. */
  step?: number;
  /** Starting delay for the first child. Default 0. */
  initialDelay?: number;
  className?: string;
  from?: "up" | "left" | "right" | "scale";
  distance?: number;
}

export function FadeInStagger({
  children,
  step = 100,
  initialDelay = 0,
  className = "",
  from = "up",
  distance = 40,
}: FadeInStaggerProps) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className={className}>
      {items.map((child, i) => (
        <FadeIn
          key={i}
          delay={initialDelay + i * step}
          from={from}
          distance={distance}
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
}
