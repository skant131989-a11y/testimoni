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
  /** Called when the widget can't work at all (script blocked, widget
   *  error). Parents should fail open per the file header rather than
   *  leave the user waiting on a token that will never arrive. */
  onUnavailable?: () => void;
  /** Optional theme override — defaults to auto (follows OS). */
  theme?: "auto" | "light" | "dark";
  /** Size of the widget — invisible for Managed mode, or "normal". */
  size?: "invisible" | "normal" | "compact";
  /** "interaction-only" hides the widget unless Cloudflare needs the
   *  visitor to interact. Defaults to "always" (unchanged behaviour). */
  appearance?: "always" | "execute" | "interaction-only";
  /** Bump this number to reset the widget and get a fresh token.
   *  Tokens are single-use, so callers must do this after every
   *  verification attempt or the next submit reuses a spent token. */
  resetSignal?: number;
  className?: string;
}

// How long to wait for a token before treating the widget as
// unavailable. Cloudflare normally resolves in a second or two.
const TOKEN_TIMEOUT_MS = 15_000;

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
        appearance?: string;
      },
    ) => string;
    remove: (id: string) => void;
    reset: (id: string) => void;
  };
}

export function Turnstile({
  onToken,
  onExpire,
  onUnavailable,
  theme = "auto",
  size = "normal",
  appearance = "always",
  resetSignal = 0,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Some browsers and extensions load the Turnstile script but block
  // its challenge frame, so the widget never resolves and never
  // errors. If no token shows up in time, report it unavailable so
  // the form fails open instead of waiting forever.
  function armTokenTimeout() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onUnavailable?.(), TOKEN_TIMEOUT_MS);
  }
  function clearTokenTimeout() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled) return;
        const w = window as TurnstileWindow;
        if (!w.turnstile || !containerRef.current) return;
        armTokenTimeout();
        widgetIdRef.current = w.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            clearTokenTimeout();
            onToken(token);
          },
          "expired-callback": () => onExpire?.(),
          "error-callback": () => {
            onExpire?.();
            onUnavailable?.();
          },
          theme,
          size,
          appearance,
        });
      })
      .catch(() => {
        // Fail-open — see file header. Tell the parent so it stops
        // waiting for a token that will never arrive.
        onUnavailable?.();
      });

    return () => {
      cancelled = true;
      clearTokenTimeout();
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

  useEffect(() => {
    if (!resetSignal) return;
    const w = window as TurnstileWindow;
    if (widgetIdRef.current && w.turnstile) {
      try {
        w.turnstile.reset(widgetIdRef.current);
        armTokenTimeout();
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  if (!siteKey) return null;
  return <div ref={containerRef} className={className} />;
}
