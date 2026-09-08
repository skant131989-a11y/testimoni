"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  Star,
  ArrowRight,
  Twitter,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/letter-avatar";
import { track } from "@/lib/analytics";

/**
 * Auto-looping screenshot → testimonial demo.
 *
 * Costs ZERO API calls — the "extractions" are hand-authored and
 * shipped as static data. Users watch the same three examples cycle
 * on autoplay: mock screenshot → shimmer → extracted testimonial
 * card → repeat. Same wow moment as a live extraction, unbypassable
 * abuse-wise, and no cold-traffic Claude cost.
 *
 * The examples cover Twitter DM, Slack, and WhatsApp so visitors
 * see the full breadth (not just one platform). Each cycle is ~6s
 * so all three play in under 20s — a visitor scanning the hero
 * sees the range without waiting.
 *
 * CTA: sign up to try it on YOUR screenshot. Signed-in flow is
 * the real path — this component is a marketing surface only.
 */

interface Example {
  /** Platform (drives the mock UI chrome). */
  platform: "twitter_dm" | "slack" | "whatsapp";
  /** Sender info for the mock. */
  from: { name: string; handle: string; avatarColor: string };
  /** The message shown in the mock screenshot. */
  message: string;
  /** What we extract — the testimonial-shaped payload. */
  extracted: {
    quote: string;
    author: string;
    handle: string;
    sourceLabel: string;
  };
}

const EXAMPLES: Example[] = [
  {
    platform: "twitter_dm",
    from: {
      name: "Sarah Chen",
      handle: "@sarahchen",
      avatarColor: "bg-emerald-500",
    },
    message:
      "Just onboarded my first 20 customers using your form flow and my landing page finally has proof. This used to take me a whole weekend of screenshots.",
    extracted: {
      quote:
        "Just onboarded my first 20 customers using your form flow and my landing page finally has proof. This used to take me a whole weekend of screenshots.",
      author: "Sarah Chen",
      handle: "sarahchen",
      sourceLabel: "Twitter DM",
    },
  },
  {
    platform: "slack",
    from: {
      name: "Marcus Johnson",
      handle: "marcus",
      avatarColor: "bg-blue-600",
    },
    message:
      "hey team — the widget you built loaded in under 200ms on our shopify store. our conversion rate on the pricing page jumped 18% this week.",
    extracted: {
      quote:
        "The widget loaded in under 200ms on our Shopify store. Our conversion rate on the pricing page jumped 18% this week.",
      author: "Marcus Johnson",
      handle: "marcus",
      sourceLabel: "Slack",
    },
  },
  {
    platform: "whatsapp",
    from: {
      name: "Priya Menon",
      handle: "+91 98xxx",
      avatarColor: "bg-orange-500",
    },
    message:
      "Neha! I set up my testimonials wall in about 5 minutes yesterday. It's wild — everyone should be using this instead of screenshots on Notion 🩷",
    extracted: {
      quote:
        "I set up my testimonials wall in about 5 minutes yesterday. It's wild — everyone should be using this instead of screenshots on Notion.",
      author: "Priya Menon",
      handle: "priya",
      sourceLabel: "WhatsApp",
    },
  },
];

// Timing per example: 2.2s show → 1s "extracting" → 2.8s reveal card. Total 6s.
const PHASE_DURATIONS = { show: 2200, extract: 1000, reveal: 2800 } as const;
const CYCLE_MS = Object.values(PHASE_DURATIONS).reduce((a, b) => a + b, 0);

type Phase = "show" | "extract" | "reveal";

export function ScreenshotDemo() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("show");
  // Ref-based dedupe so React StrictMode's double-invoke of effects
  // doesn't fire the "demo viewed" event twice on mount in dev.
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    track("screenshot_demo_viewed", {}, { anonymous: true });
  }, []);

  // Advance through phases: show → extract → reveal → next example.
  useEffect(() => {
    let mounted = true;
    const durations: [Phase, number][] = [
      ["show", PHASE_DURATIONS.show],
      ["extract", PHASE_DURATIONS.extract],
      ["reveal", PHASE_DURATIONS.reveal],
    ];
    // Schedule each phase transition relative to now.
    let cumulative = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    durations.forEach(([p, d], i) => {
      cumulative += d;
      // First phase is set immediately below; schedule subsequent ones.
      if (i === 0) return;
      timers.push(
        setTimeout(() => {
          if (mounted) setPhase(p);
        }, cumulative - d + durations[0][1]),
      );
    });
    // At the end of the reveal, advance to the next example and
    // reset to the "show" phase.
    const advance = setTimeout(() => {
      if (!mounted) return;
      setPhase("show");
      setExampleIdx((i) => (i + 1) % EXAMPLES.length);
    }, CYCLE_MS);
    timers.push(advance);
    // No need to reset phase to "show" here — the advance callback
    // sets it before rotating the example, and on first mount the
    // useState initializer already gives us "show".
    return () => {
      mounted = false;
      timers.forEach(clearTimeout);
    };
  }, [exampleIdx]);

  const example = EXAMPLES[exampleIdx];

  return (
    <div className="relative w-full">
      {/* Header — "Watch us extract" pitch */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Live demo
        </p>
        <div className="flex items-center gap-1.5">
          {EXAMPLES.map((_, i) => (
            <button
              key={i}
              onClick={() => setExampleIdx(i)}
              aria-label={`Show example ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === exampleIdx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stacked panels — screenshot (top) and extracted card (bottom).
          Both always in the DOM; opacity + transform animate the
          transition so React doesn't unmount+remount and lose the
          card's "grow into place" feel. */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-card shadow-2xl">
        {/* Extracting shimmer overlay — sits above the screenshot
            during the "extract" phase to sell the moment. */}
        {phase === "extract" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-semibold text-primary">
                Reading the screenshot…
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pulling quote, author, and source
              </p>
            </div>
          </div>
        )}

        {/* Screenshot mock — always rendered, faded/scaled during reveal */}
        <div
          className={`transition-all duration-500 ${
            phase === "reveal" ? "scale-[0.98] opacity-40" : "opacity-100"
          }`}
        >
          <MockScreenshot example={example} />
        </div>

        {/* Extracted testimonial card — slides in from below on reveal */}
        <div
          className={`absolute inset-x-3 bottom-3 z-10 transition-all duration-500 ${
            phase === "reveal"
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          <ExtractedCard extracted={example.extracted} />
        </div>
      </div>

      {/* CTA — always visible below the demo */}
      <div className="mt-5">
        <Link
          href="/signup?from=hero_screenshot_demo"
          onClick={() =>
            track(
              "screenshot_demo_signup_clicked",
              { example_idx: exampleIdx },
              { anonymous: true },
            )
          }
          className="block"
        >
          <Button size="lg" className="w-full gap-2 shadow-lg">
            <Sparkles className="h-4 w-4" />
            Convert your screenshot to a testimonial — Sign up free{" "}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          5 free extractions on the Free plan · Unlimited on Pro
        </p>
      </div>
    </div>
  );
}

/** Renders a mock screenshot styled like the platform's app UI. */
function MockScreenshot({ example }: { example: Example }) {
  if (example.platform === "twitter_dm") {
    return (
      <div className="bg-slate-950 p-4 pb-16">
        <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Twitter className="h-4 w-4 text-white" />
          <p className="text-xs font-semibold text-white">Direct Messages</p>
        </div>
        <div className="flex items-start gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${example.from.avatarColor}`}
          >
            {example.from.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-400">
              {example.from.name} · {example.from.handle}
            </p>
            <div className="mt-1 max-w-full rounded-2xl rounded-tl-md bg-blue-600 px-3 py-2 text-xs leading-relaxed text-white">
              {example.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (example.platform === "slack") {
    return (
      <div className="bg-white p-4 pb-20">
        <div className="mb-3 flex items-center gap-2 border-b pb-3">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-purple-500 to-pink-500">
            <span className="text-[9px] font-black text-white">#</span>
          </div>
          <p className="text-xs font-semibold text-slate-900">
            # customer-love
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold text-white ${example.from.avatarColor}`}
          >
            {example.from.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="text-xs font-bold text-slate-900">
                {example.from.name}
              </p>
              <p className="text-[10px] text-slate-500">2:14 PM</p>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-900">
              {example.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // whatsapp
  return (
    <div className="bg-[#e5ddd5] p-4 pb-16">
      <div className="mb-3 flex items-center gap-2 border-b border-black/10 pb-3">
        <MessageCircle className="h-4 w-4 text-emerald-700" />
        <p className="text-xs font-bold text-slate-900">
          {example.from.name}
        </p>
      </div>
      <div className="flex items-start gap-2">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${example.from.avatarColor}`}
        >
          {example.from.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="max-w-full rounded-lg rounded-tl-sm bg-white px-3 py-2 shadow-sm">
            <p className="text-xs leading-relaxed text-slate-900">
              {example.message}
            </p>
            <p className="mt-1 text-right text-[9px] text-slate-500">2:14 PM ✓✓</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The polished testimonial card that "slides in" as the extraction result. */
function ExtractedCard({
  extracted,
}: {
  extracted: Example["extracted"];
}) {
  return (
    <div className="rounded-xl border border-primary/30 bg-white p-3 shadow-2xl">
      <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
        <Sparkles className="h-2.5 w-2.5" /> Extracted
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-slate-900">
        &ldquo;{extracted.quote}&rdquo;
      </p>
      <div className="mt-2 flex items-center gap-2 border-t pt-1.5">
        <LetterAvatar name={extracted.author} size={22} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-900">
            {extracted.author}
          </p>
          <p className="text-[9px] text-slate-500">@{extracted.handle}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-600">
          <MessageSquare className="h-2 w-2" /> {extracted.sourceLabel}
        </span>
      </div>
    </div>
  );
}
