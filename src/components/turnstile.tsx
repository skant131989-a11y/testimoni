"use client";

import { useEffect, useRef } from "react";

/**
 * Turnstile widget wrapper.
 *
 * Uses Cloudflare's global script (loaded from challenges.cloudflare.com)
 * via the built-in explicit-render callback, so we get full control over
 * mount / unmount and can call reset() on error / re-submit.
 *
 * ── Env ─────────────────────────────────────────────────────────
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY must be set. If missing, the
 * component renders nothing and the parent form should let the
 * user through — degrading open beats blocking legit users when
 * config drifts.
 */

interface Props {
  /** Called with the widget's token whenever the challenge resolves. */
  onToken: (token: string) => void;
  /** Called with null when the widget expires or errors. */
  onExpire?: () => void;
  /** Optional theme override — defaults to auto (follows OS). */
  theme?: "auto" | "light" | "dark";
  /** Size of the widget — invisible for Managed mode, or "normal". */
  size?: "invisible" | "normal" | "compact";
  className?: string;
}

// One-time script loader so multiple widgets on the page share the
// same fetch.
let scriptLoaded = false;
let scriptLoadingPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (
      el: HTMLElement,
      opts: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: string;
        size?: string;
      },
    ) => string;
    remove: (id: string) => void;
    reset: (id: string) => void;
  };
}

export function Turnstile({
  onToken,
  onExpire,
  theme = "auto",
  size = "normal",
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled) return;
        const w = window as TurnstileWindow;
        if (!w.turnstile || !containerRef.current) return;
        widgetIdRef.current = w.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => onExpire?.(),
          theme,
          size,
        });
      })
      .catch(() => {
        // Fail-open — see file header.
      });

    return () => {
      cancelled = true;
      const w = window as TurnstileWindow;
      if (widgetIdRef.current && w.turnstile) {
        try {
          w.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className={className} />;
}
