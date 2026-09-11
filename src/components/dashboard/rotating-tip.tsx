"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Youtube,
  Code2,
  Sparkles,
  Gauge,
  Star,
  MessageSquare,
  Video,
  ChevronRight,
  Zap,
  Send,
  Search,
  Palette,
} from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * RotatingTip — one small nudge at the bottom of the dashboard that
 * cycles between 5–8 tips every ~6 seconds. Replaces the stacked
 * NBA + video banner + milestone strips that used to compete for
 * attention.
 *
 * Only shows tips that are actually relevant to this user's current
 * state (e.g. "add a video" is skipped if they already have videos).
 * Each tip is dismissible individually — dismissing removes it from
 * the local rotation so the user doesn't see it again this session.
 *
 * Rotation is paused on hover so users can read a tip fully.
 */

interface Tip {
  key: string;
  eyebrow: string;
  headline: string;
  ctaLabel: string;
  ctaHref: string;
  eligible: boolean;
  /** Small icon that leads each tip visually. */
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Props {
  state: {
    totalTestimonials: number;
    videoCount: number;
    activeWidgets: number;
    impressionsTotal: number;
    hasWallScoreRun: boolean;
    hasAskMyWall: boolean;
    hasFormLink: boolean;
  };
  wallUrl?: string;
}

const ROTATE_MS = 7000;

export function RotatingTip({ state, wallUrl }: Props) {
  // Compute the eligible tips from user state. Order = priority
  // for the initial render (small tie-breaker).
  const allTips: Tip[] = [
    {
      key: "copy_form",
      eyebrow: "Share it",
      headline: "Copy your form link — DM it to your 5 happiest customers",
      ctaLabel: "Copy link",
      ctaHref: "/dashboard/collect",
      eligible: state.hasFormLink && state.totalTestimonials < 5,
      Icon: Send,
      color: "text-emerald-600",
    },
    {
      key: "try_find_proof",
      eyebrow: "Free tool",
      headline: "Try Find my proof — paste your URL, we scan for testimonials",
      ctaLabel: "Try it",
      ctaHref: "/tools/find-my-proof",
      eligible: state.totalTestimonials < 10,
      Icon: Search,
      color: "text-violet-600",
    },
    {
      key: "embed_widget",
      eyebrow: "Ship your wall",
      headline:
        state.impressionsTotal === 0
          ? "Nobody's seen your wall yet — put it on your site"
          : "Add another widget layout — try masonry or marquee",
      ctaLabel: "Copy embed",
      ctaHref: "/dashboard/widgets",
      eligible: state.activeWidgets >= 1,
      Icon: Code2,
      color: "text-violet-600",
    },
    {
      key: "add_video",
      eyebrow: "Convert 2× better",
      headline: "Add your first video testimonial — free on every plan",
      ctaLabel: "Upload",
      ctaHref: "/dashboard/import?tab=video",
      eligible: state.totalTestimonials >= 3 && state.videoCount === 0,
      Icon: Video,
      color: "text-rose-500",
    },
    {
      key: "wall_score",
      eyebrow: "Audit your wall",
      headline: "Run Wall Score — see which testimonials to ask for next",
      ctaLabel: "Run audit",
      ctaHref: "/dashboard/wall-score",
      eligible: state.totalTestimonials >= 5 && !state.hasWallScoreRun,
      Icon: Gauge,
      color: "text-blue-600",
    },
    {
      key: "ask_my_wall",
      eyebrow: "Pro AI",
      headline:
        "Turn your wall into a chatbot — visitors ask, real customers answer",
      ctaLabel: "Enable it",
      ctaHref: "/dashboard/ask-my-wall",
      eligible: state.totalTestimonials >= 10 && !state.hasAskMyWall,
      Icon: MessageSquare,
      color: "text-emerald-600",
    },
    {
      key: "tweet_drafts",
      eyebrow: "Amplify",
      headline: "Turn any testimonial into 3 tweet drafts — one-click to X",
      ctaLabel: "Open drafts",
      ctaHref: "/dashboard/tweet-drafts",
      eligible: state.totalTestimonials >= 5,
      Icon: Zap,
      color: "text-sky-500",
    },
    {
      key: "star_badge",
      eyebrow: "Show credit",
      headline: "Drop a live G2-style star badge on your homepage",
      ctaLabel: "Grab embed",
      ctaHref: "/tools/star-badge",
      eligible: state.totalTestimonials >= 3,
      Icon: Star,
      color: "text-yellow-500",
    },
    {
      key: "share_wall",
      eyebrow: "Share it",
      headline: "Your hosted Wall of Love has a public URL — DM it to a customer",
      ctaLabel: "See it",
      ctaHref: wallUrl ?? "/dashboard/widgets",
      eligible: !!wallUrl && state.totalTestimonials >= 3,
      Icon: Eye,
      color: "text-fuchsia-500",
    },
    {
      key: "youtube_wall",
      eyebrow: "Repurpose",
      headline: "Have YouTube reviews? Import them as video testimonials",
      ctaLabel: "How-to",
      ctaHref: "/dashboard/import?tab=video",
      eligible: state.totalTestimonials >= 5 && state.videoCount === 0,
      Icon: Youtube,
      color: "text-red-500",
    },
    {
      key: "theme_customize",
      eyebrow: "Make it yours",
      headline: "Customize your widget colors + fonts to match your brand",
      ctaLabel: "Customize",
      ctaHref: "/dashboard/widgets",
      eligible: state.totalTestimonials >= 3 && state.activeWidgets >= 1,
      Icon: Palette,
      color: "text-orange-500",
    },
    {
      key: "ask_templates",
      eyebrow: "40% reply rate",
      headline: "Grab our proven ask templates — WhatsApp, email, LinkedIn",
      ctaLabel: "Open templates",
      ctaHref: "/tools/ask-templates",
      eligible: state.totalTestimonials < 10,
      Icon: Sparkles,
      color: "text-teal-500",
    },
  ];

  // Load dismissed keys once per mount.
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("rotating_tips_dismissed");
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const eligibleTips = allTips.filter(
    (t) => t.eligible && !dismissed.has(t.key),
  );

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || eligibleTips.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % eligibleTips.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, eligibleTips.length]);

  // Clamp idx if the list shrinks (user dismisses).
  useEffect(() => {
    if (idx >= eligibleTips.length) setIdx(0);
  }, [eligibleTips.length, idx]);

  if (eligibleTips.length === 0) return null;
  const tip = eligibleTips[idx];
  const Icon = tip.Icon;

  function dismiss() {
    const next = new Set(dismissed);
    next.add(tip.key);
    setDismissed(next);
    try {
      window.sessionStorage.setItem(
        "rotating_tips_dismissed",
        JSON.stringify(Array.from(next)),
      );
    } catch {}
    track("rotating_tip_dismissed", { key: tip.key });
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.04] via-background to-fuchsia-50/50 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <Icon className={`h-4 w-4 ${tip.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            {tip.eyebrow}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {tip.headline}
          </p>
        </div>
        <Link
          href={tip.ctaHref}
          onClick={() => track("rotating_tip_cta", { key: tip.key })}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow"
        >
          {tip.ctaLabel} <ChevronRight className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss tip"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100 hover:text-foreground"
        >
          ×
        </button>
      </div>

      {/* Progress dots — only when more than one tip is in rotation */}
      {eligibleTips.length > 1 && (
        <div className="mt-2 flex gap-1">
          {eligibleTips.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i === idx ? "bg-primary" : "bg-primary/15"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
