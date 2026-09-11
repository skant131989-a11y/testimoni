"use client";

import { useEffect, useState } from "react";

/**
 * StuckReloader — sits inside a Next.js loading.tsx skeleton and
 * force-reloads the page if the skeleton is still visible after a
 * short timeout.
 *
 * Why this exists — Supabase's server-side session cookie is
 * occasionally not fully committed by the time the OAuth callback
 * redirects into /dashboard. The RSC handshake or the layout's
 * getUser() call then hangs waiting for a cookie that isn't there,
 * and the skeleton stays visible until the browser or Next times
 * out on its own (which can be minutes).
 *
 * We give the real page 8 seconds to render. If the component is
 * still mounted at that point, the real page hasn't loaded — reload
 * once. When the real page mounts, this component unmounts and its
 * timer is cancelled.
 *
 * We reload at most once per session to avoid infinite loops on a
 * genuinely broken deploy. The flag is stored in sessionStorage
 * keyed by pathname.
 */

interface Props {
  /** Milliseconds to wait before reloading. Default 8 seconds. */
  timeoutMs?: number;
  /** Optional path suffix so multiple skeletons don't share flags. */
  scope?: string;
}

export function StuckReloader({ timeoutMs = 8000, scope = "dashboard" }: Props) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const key = `stuck_reload_${scope}`;
    const alreadyRetried =
      typeof window !== "undefined" && window.sessionStorage.getItem(key) === "1";

    const t = setTimeout(() => {
      if (alreadyRetried) {
        // We already tried once this session — surface a manual
        // retry instead of looping. Real deploys where the page
        // is broken won't be hidden by an infinite reload.
        setShowHelp(true);
        return;
      }
      try {
        window.sessionStorage.setItem(key, "1");
      } catch {}
      window.location.reload();
    }, timeoutMs);

    return () => clearTimeout(t);
  }, [timeoutMs, scope]);

  if (!showHelp) return null;

  return (
    <div className="mt-6 flex items-center justify-center">
      <div className="max-w-md rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-900 shadow-sm">
        <p className="font-semibold">Still loading?</p>
        <p className="mt-1 text-xs">
          Sign-in usually needs a beat to settle. Try one of these:
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              try {
                window.sessionStorage.removeItem(`stuck_reload_${scope}`);
              } catch {}
              window.location.reload();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 hover:-translate-y-0.5 hover:shadow-sm"
          >
            Reload
          </button>
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 hover:-translate-y-0.5 hover:shadow-sm"
          >
            Sign in again
          </a>
        </div>
      </div>
    </div>
  );
}
