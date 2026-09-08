"use client";

import confetti from "canvas-confetti";

/**
 * Small confetti helpers used across dashboard / welcome / paste
 * success moments. Keep the physics tasteful — bursts should feel
 * celebratory, not gaudy. Testimoni palette (purples + hot pinks +
 * yellow star) baked in as the default color set.
 */

const TESTIMONI_COLORS = [
  "#7348dc", // brand purple
  "#a78bfa", // lighter purple
  "#ec4899", // hot pink
  "#f472b6", // pink
  "#fbbf24", // yellow (matches star ratings)
];

/**
 * A single burst from the center — the workhorse. Use when a user
 * completes a discrete action (first testimonial pasted, wall
 * embedded, etc.).
 */
export function celebrateBurst() {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
    colors: TESTIMONI_COLORS,
    scalar: 1.0,
  });
}

/**
 * Sustained "you got a testimonial" celebration — a couple of
 * left/right bursts over 500ms. More cinematic than a single pop,
 * appropriate for the first-testimonial moment.
 */
export function celebrateFirstTestimonial() {
  const end = Date.now() + 500;
  const interval = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      return;
    }
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: TESTIMONI_COLORS,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: TESTIMONI_COLORS,
    });
  }, 200);
}
