"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Sparkles, ArrowRight, X, Twitter, MessageCircle, Trophy, Star, Linkedin } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * FindMyProofCard — a signed-in nudge to try the free find-my-proof
 * wedge. Same brand violet-purple gradient as the marketing hero so
 * a founder who just signed up recognises the tool from the home
 * page they came from.
 *
 * Usage:
 *   <FindMyProofCard surface="dashboard" />
 *   <FindMyProofCard surface="welcome" dismissible websiteUrl="acme.com" />
 *
 * Dismissible cards remember the choice in localStorage keyed by
 * surface so we don't nag every session.
 */

interface Props {
  surface: string;
  /** Optional URL to pre-fill in the tool link (query param ?url=…). */
  websiteUrl?: string;
  /** When true, shows a small × close button; state persists via localStorage. */
  dismissible?: boolean;
}

const SOURCES = [
  { Icon: Twitter, color: "text-sky-500", label: "X" },
  { Icon: MessageCircle, color: "text-orange-500", label: "Reddit" },
  { Icon: Trophy, color: "text-orange-600", label: "Product Hunt" },
  { Icon: Star, color: "text-yellow-500", label: "App Store" },
  { Icon: Linkedin, color: "text-blue-600", label: "LinkedIn" },
];

export function FindMyProofCard({ surface, websiteUrl, dismissible }: Props) {
  const key = `dismissed_find_proof_card_${surface}`;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!dismissible) return;
    try {
      if (window.localStorage.getItem(key) === "1") setHidden(true);
    } catch {
      // Silent — Safari private mode etc.
    }
  }, [dismissible, key]);

  if (hidden) return null;

  const href = websiteUrl
    ? `/tools/find-my-proof?url=${encodeURIComponent(websiteUrl)}`
    : "/tools/find-my-proof";

  function dismiss() {
    setHidden(true);
    try {
      window.localStorage.setItem(key, "1");
    } catch {}
    track("find_proof_card_dismissed", { surface });
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-violet-200/60 bg-gradient-to-br from-violet-100/80 via-purple-50 to-fuchsia-50/60 p-5 shadow-lg shadow-violet-500/10 md:p-6">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -left-8 top-4 h-32 w-32 rounded-full bg-violet-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 bottom-4 h-32 w-32 rounded-full bg-fuchsia-400/20 blur-3xl" />

      {dismissible && (
        <button
          onClick={dismiss}
          type="button"
          aria-label="Dismiss"
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-white/80 text-slate-500 hover:text-slate-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-600/30 bg-white/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700">
            <Sparkles className="h-3 w-3" /> Free tool · No cost
          </span>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Have you tried{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              Find my proof
            </span>
            ?
          </h3>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-700">
            Paste your website URL and we&rsquo;ll scan the whole public web
            for real customer praise about your product — the mentions you
            can save straight to your wall in one click.
          </p>

          {/* Sources chips */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
            {SOURCES.map(({ Icon, color, label }) => (
              <span key={label} className="inline-flex items-center gap-1">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                {label}
              </span>
            ))}
            <span className="text-slate-500">& more</span>
          </div>
        </div>

        <Link
          href={href}
          onClick={() =>
            track("find_proof_card_cta", { surface, has_url: !!websiteUrl })
          }
          className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl md:self-auto"
        >
          <Search className="h-4 w-4" />
          Try it now
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
