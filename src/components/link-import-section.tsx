"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Link2,
  ArrowRight,
  Twitter,
  Linkedin,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { track } from "@/lib/analytics";
import { HeroDualDemo } from "@/components/hero-dual-demo";

/**
 * LinkImportSection — Section 3 on the home page.
 * The story: "already saw a rave? Just drop the URL."
 *
 * Mockup loops a tweet-URL type → extracted quote card slide-in →
 * LinkedIn URL type → second card slide-in on top. Same hardcoded
 * founders as the wedge banner so the two mockups feel like they
 * belong to the same product family.
 */

const TWEET_URL = "https://x.com/tanmay/status/181593048...";
const LI_URL = "https://linkedin.com/posts/priya-sharma_activity...";

interface Card {
  content: string;
  author: string;
  role: string;
  source: string;
  score: number;
  color: string;
  initial: string;
}

const CARDS: Card[] = [
  {
    content:
      "Just dropped 5 old tweets into Testimoni. 5 minutes later I had a Wall of Love. Wild.",
    author: "@tanmay",
    role: "Founder, InboxIQ",
    source: "X",
    score: 88,
    color: "from-sky-500 to-cyan-500",
    initial: "T",
  },
  {
    content:
      "Testimoni is the first Wall-of-Love tool that respects credit — the original tweet stays linked.",
    author: "Priya Sharma",
    role: "Product Lead, StripeFlow",
    source: "LinkedIn",
    score: 92,
    color: "from-blue-500 to-indigo-600",
    initial: "P",
  },
];

export function LinkImportSection() {
  return (
    <section
      id="drop-link"
      className="relative overflow-hidden border-t bg-gradient-to-br from-violet-100/70 via-purple-50 to-indigo-50/40 py-16 md:py-24"
    >
      {/* Ambient blobs to mirror the hero's depth without repeating
          its exact palette — this section is blue/indigo where the
          hero is fuchsia/purple. Reads as a sibling, not a copy. */}
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2 md:gap-14">
        {/* Interactive demo — left on desktop for variety with the hero */}
        <div className="md:order-2">
          <HeroDualDemo />
        </div>
        {/* Copy */}
        <div className="md:order-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-600/30 bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
            <Link2 className="h-3 w-3" /> Try it live · No signup
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
            Already have a rave{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              in mind?
            </span>{" "}
            Drop the link — right here.
          </h2>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Saw a tweet praising you? A LinkedIn post? A blog review? Paste
            the URL in the box → we pull the quote, author, and source
            instantly. Try it live in the panel — <em>no signup, real result.</em>
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Free
              forever
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No
              credit card
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Live in
              ~30 seconds
            </span>
          </div>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/signup?src=home_drop_link"
              onClick={() =>
                track("home_link_import_signup_cta", {
                  placement: "section2_merged",
                })
              }
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30 md:text-base"
            >
              Turn these into my wall
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="text-xs text-muted-foreground">
              10 testimonials free, forever.
            </p>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Twitter className="h-3.5 w-3.5 text-sky-500" /> Tweets / X posts
            </li>
            <li className="flex items-center gap-1.5">
              <Linkedin className="h-3.5 w-3.5 text-blue-600" /> LinkedIn posts
            </li>
            <li className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-orange-500" /> Reddit
              comments
            </li>
            <li className="flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Blog reviews, G2, any
              URL
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// The animated LinkImportMockup / QuoteCardInner components below
// are kept for reference / possible future reuse — the section now
// renders the interactive HeroDualDemo on the right instead of the
// passive loop. If we ever revert, uncomment the section prop above
// to swap them back in.

// ─── Mockup ──────────────────────────────────────────────────────

function LinkImportMockup() {
  // Loop states:
  // 0 → typing tweet URL (0.0–1.5s)
  // 1 → tweet card slides in (1.5–3.5s)
  // 2 → LinkedIn URL types (3.5–5.0s)
  // 3 → LinkedIn card slides on top (5.0–7.0s)
  // 4 → hold (7.0–8.0s) → back to 0
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let mounted = true;
    let t: ReturnType<typeof setTimeout>;
    const type = (text: string, thenPhase: number, holdMs: number) => {
      setTyped("");
      text.split("").forEach((_, i) => {
        setTimeout(
          () => mounted && setTyped(text.slice(0, i + 1)),
          20 * (i + 1),
        );
      });
      t = setTimeout(
        () => mounted && setPhase(thenPhase),
        Math.max(500, text.length * 20 + 200),
      );
      // schedule next transition after hold
      t = setTimeout(() => mounted && advance(thenPhase), holdMs);
    };
    const advance = (from: number) => {
      if (!mounted) return;
      if (from === 1) {
        setPhase(2);
        type(LI_URL, 3, 2200);
      } else if (from === 3) {
        // final hold, then reset
        t = setTimeout(() => {
          if (!mounted) return;
          setPhase(0);
          type(TWEET_URL, 1, 2000);
        }, 1500);
      }
    };
    setPhase(0);
    type(TWEET_URL, 1, 2000);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, []);

  const showFirst = phase >= 1;
  const showSecond = phase >= 3;

  return (
    <div className="relative rounded-3xl border border-blue-200/70 bg-white/90 p-4 shadow-2xl shadow-blue-500/10 backdrop-blur md:p-5">
      {/* URL bar */}
      <div className="flex items-center gap-2 rounded-2xl border-2 border-blue-200 bg-white p-2 pl-3 shadow-sm">
        <Link2 className="h-4 w-4 shrink-0 text-blue-500" />
        <div className="flex-1 truncate text-xs text-slate-700">
          {typed}
          <span
            className={`ml-0.5 inline-block h-3 w-[1.5px] bg-slate-400 align-middle ${
              phase === 0 || phase === 2 ? "animate-pulse" : "opacity-0"
            }`}
          />
        </div>
        <div className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white">
          Add link
        </div>
      </div>

      {/* Result card 1 */}
      <div
        className={`mt-4 rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-sm transition-all duration-500 ${
          showFirst ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <QuoteCardInner card={CARDS[0]} rank={1} />
      </div>

      {/* Result card 2 — slides in on top of the first */}
      <div
        className={`mt-3 rounded-2xl border-2 border-indigo-100 bg-white p-4 shadow-sm transition-all duration-500 ${
          showSecond ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <QuoteCardInner card={CARDS[1]} rank={2} />
      </div>
    </div>
  );
}

function QuoteCardInner({ card, rank }: { card: Card; rank: number }) {
  return (
    <>
      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold text-violet-700">
        <span className="rounded-full bg-blue-100 px-1.5 py-0.5">
          #{rank} · {card.score}/100
        </span>
        <span className="text-muted-foreground">via {card.source}</span>
      </div>
      <p className="text-sm italic leading-relaxed text-slate-800">
        &ldquo;{card.content}&rdquo;
      </p>
      <div className="mt-2 flex items-center gap-2 border-t pt-2 text-xs">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${card.color} text-[10px] font-bold text-white`}
        >
          {card.initial}
        </div>
        <div>
          <p className="font-semibold">{card.author}</p>
          <p className="text-[10px] text-muted-foreground">{card.role}</p>
        </div>
      </div>
    </>
  );
}
