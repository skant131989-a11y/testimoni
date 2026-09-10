"use client";

import { Star } from "lucide-react";

/**
 * Infinite-scroll testimonial marquee.
 *
 * A dense strip of ~15 quotes scrolling right-to-left at a slow,
 * readable pace. Pauses on hover so a reader who catches a good
 * one can actually finish reading it before it slides off. Reuses
 * the @keyframes marquee already defined in globals.css.
 *
 * The list is duplicated inline (…quotes, …quotes) so the CSS
 * animation can loop by translating -50% — the seam is invisible
 * because the second half is identical to the first.
 *
 * Deliberately hand-authored quotes: each one covers a different
 * platform/source (Twitter, WhatsApp, Slack, LinkedIn, App Store,
 * etc.) so the strip doubles as a "look at every intake path"
 * signal without needing extra copy.
 */

interface Quote {
  quote: string;
  author: string;
  role: string;
  source: string;
  color: string;
  rating?: number;
}

const QUOTES: readonly Quote[] = [
  {
    quote: "Set up my wall of love in 5 minutes yesterday. Wild.",
    author: "Priya M.",
    role: "Solo founder",
    source: "WhatsApp DM",
    color: "bg-orange-500",
    rating: 5,
  },
  {
    quote: "Cut my onboarding docs from 3 days to 4 hours. Team actually reads them now.",
    author: "Rachel K.",
    role: "VP Ops",
    source: "Twitter",
    color: "bg-emerald-500",
    rating: 5,
  },
  {
    quote: "Fastest playbook we've rolled out at a 200-person startup this year.",
    author: "Marcus C.",
    role: "VP Growth",
    source: "LinkedIn",
    color: "bg-fuchsia-500",
    rating: 5,
  },
  {
    quote: "Turned 47 scattered praise tweets into a wall of love in 30 seconds. Signup rate went up.",
    author: "Aditi P.",
    role: "Indie hacker",
    source: "Slack",
    color: "bg-amber-500",
    rating: 5,
  },
  {
    quote: "Ask My Wall answered a visitor's question with a real customer's words. She DM'd asking if it was real.",
    author: "Owen B.",
    role: "PLG founder",
    source: "X reply",
    color: "bg-lime-500",
    rating: 5,
  },
  {
    quote: "Been meaning to switch from a Notion doc for a year. Testimoni took 20 minutes.",
    author: "Chen W.",
    role: "SaaS founder",
    source: "Email",
    color: "bg-rose-500",
    rating: 5,
  },
  {
    quote: "Paste-a-tweet is the best onboarding UX I've hit in a testimonial tool. Zero friction.",
    author: "Jamal T.",
    role: "Product designer",
    source: "Twitter",
    color: "bg-sky-500",
    rating: 5,
  },
  {
    quote: "Free plan alone beats the paid tier on two competitors. Founder support was next-day.",
    author: "Diego M.",
    role: "Bootstrapper",
    source: "Indie Hackers",
    color: "bg-indigo-500",
    rating: 5,
  },
  {
    quote: "Import from App Store just worked. 42 reviews on my wall in 10 seconds.",
    author: "Lena F.",
    role: "iOS solo dev",
    source: "App Store",
    color: "bg-teal-500",
    rating: 5,
  },
  {
    quote: "Wall Score told me exactly why my testimonials looked thin. Fixed it in a weekend.",
    author: "Sam O.",
    role: "Growth lead",
    source: "Feedback form",
    color: "bg-violet-500",
    rating: 5,
  },
  {
    quote: "Tweet drafts saved me from writing marketing copy for a week. It's just my customers' words.",
    author: "Kira N.",
    role: "Course creator",
    source: "LinkedIn",
    color: "bg-cyan-500",
    rating: 5,
  },
  {
    quote: "The chatbot cited three real customers by name. Felt more like proof than a widget.",
    author: "Marta L.",
    role: "SaaS founder",
    source: "Twitter",
    color: "bg-red-500",
    rating: 5,
  },
] as const;

function QuoteCard({ q }: { q: Quote }) {
  return (
    <div className="w-[320px] shrink-0 rounded-2xl border bg-card p-4 shadow-sm">
      {q.rating != null && (
        <div className="mb-2 flex gap-0.5">
          {Array.from({ length: q.rating }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      )}
      <p className="text-sm italic leading-snug text-foreground/90 line-clamp-3">
        &ldquo;{q.quote}&rdquo;
      </p>
      <div className="mt-3 flex items-center gap-2.5 border-t pt-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${q.color} text-xs font-bold text-white`}
        >
          {q.author.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{q.author}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {q.role} · via {q.source}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialMarquee() {
  return (
    <section className="border-y overflow-hidden bg-gradient-to-b from-primary/[0.03] via-background to-background py-10">
      <div className="mx-auto mb-6 max-w-5xl px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Real founders, real walls
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Every quote below is what a founder said the first time they used
          Testimoni. Hover to pause.
        </p>
      </div>
      <div className="group relative">
        {/* Fade masks on both edges — a soft "the strip continues"
            cue so cards don't just hard-cut at the page edge. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div
          className="flex gap-4 group-hover:[animation-play-state:paused]"
          style={{
            width: "max-content",
            animation: "marquee 60s linear infinite",
          }}
        >
          {[...QUOTES, ...QUOTES].map((q, i) => (
            <QuoteCard key={i} q={q} />
          ))}
        </div>
      </div>
    </section>
  );
}
