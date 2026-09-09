"use client";

import { useEffect } from "react";

/**
 * Reads `location.hash` on mount, smooth-scrolls to that element,
 * then clears the hash from the URL bar so:
 *   - refresh doesn't re-jump
 *   - back-button state stays sane
 *   - bookmarks stay clean
 *
 * Only reacts to the anchors we control (whitelist). Anything else
 * — including the browser's own default anchor jumps — is left alone.
 *
 * Used to catch cross-page launch-bar clicks like
 *   /pricing → click launch bar → /#new-ai-features
 * where the source-page click can't intercept the navigation, so
 * cleanup has to happen on the destination.
 */
const KNOWN_ANCHORS = ["new-ai-features"];

export function HashScrollCleanup() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash || !KNOWN_ANCHORS.includes(hash)) return;
    const target = document.getElementById(hash);
    if (!target) return;

    // Wait one frame for the layout to settle (banners, images,
    // suspense boundaries) — otherwise scrollIntoView calculates
    // against a shorter document.
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // Remove the hash without a scroll jump: replaceState.
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    });
  }, []);

  return null;
}
