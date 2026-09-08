"use client";

import { useRef, ReactNode } from "react";

/**
 * Wrapper that applies a subtle 3D perspective tilt to its children
 * following the cursor position. Feels premium without being loud
 * — the max rotation is capped at ~4° per axis, so it registers as
 * "responsive" rather than "chaotic."
 *
 * Uses raw CSS transforms + a rAF-throttled listener; no framer-
 * motion / gsap dependency. Skips entirely on touch devices (no
 * cursor to follow).
 */
interface Props {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees per axis. Default 4 — noticeably
   *  interactive but not vertigo-inducing. */
  intensity?: number;
}

export function TiltCard({ children, className = "", intensity = 4 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    if (raf.current !== null) return; // throttle to one update per frame
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    raf.current = requestAnimationFrame(() => {
      // Y-axis tilt driven by horizontal cursor position, X-axis by
      // vertical — matches natural expectation of "pushing" a corner.
      const rotY = x * intensity * 2;
      const rotX = -y * intensity * 2;
      el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      raf.current = null;
    });
  }

  function onMouseLeave() {
    if (!ref.current) return;
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    ref.current.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`transition-transform duration-100 ease-out will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
