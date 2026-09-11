"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ArrowRight,
  Twitter,
  Linkedin,
  MessageCircle,
  Trophy,
  Star,
  Newspaper,
  Award,
  Zap,
} from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { track } from "@/lib/analytics";

/**
 * WedgeBanner — the "paste your website, we find your love" pitch,
 * with a self-contained animated mockup that shows the tool's
 * output without spending a single API call.
 *
 * The mockup runs on a 6-second loop:
 *   0.0 – 1.5s  URL typing effect on the search bar
 *   1.5 – 3.0s  "Found it" pill + counted-up number + 5 source rows
 *   3.0 – 5.5s  Hardcoded quote card fades in
 *   5.5 – 6.0s  Fade back to reset, restart
 *
 * Numbers are stable — same "37 potential testimonials" every loop,
 * so scannable and doesn't feel like fake variability.
 */

const SOURCE_ROWS = [
  { icon: Twitter, label: "X posts", count: 14, color: "text-sky-500" },
  { icon: MessageCircle, label: "Reddit comments", count: 8, color: "text-orange-500" },
  { icon: Trophy, label: "Product Hunt comments", count: 6, color: "text-orange-600" },
  { icon: Star, label: "App Store reviews", count: 5, color: "text-yellow-500" },
  { icon: Linkedin, label: "LinkedIn posts", count: 4, color: "text-blue-600" },
];

const HERO_QUOTE = {
  content:
    "Testimoni pulled 27 real customer quotes I'd forgotten I had. Zero forms. Zero begging. It's magic.",
  author: "@nikhil",
  role: "Founder, ShipHub",
  score: 92,
  source: "X",
};

const URL_TEXT = "acme.com";

export function WedgeBanner() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [typed, setTyped] = useState("");

  // Loop the 3 steps forever. Each step gets a fixed dwell,
  // then advances. This is a simple state-machine timer — no
  // heavy animation library.
  useEffect(() => {
    let mounted = true;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      if (!mounted) return;
      setStep(0);
      setTyped("");
      // Typing phase — reveal one char every 90ms.
      URL_TEXT.split("").forEach((_, i) => {
        setTimeout(
          () => mounted && setTyped(URL_TEXT.slice(0, i + 1)),
          90 * (i + 1),
        );
      });
      // Advance to results.
      t = setTimeout(() => {
        if (!mounted) return;
        setStep(1);
        t = setTimeout(() => {
          if (!mounted) return;
          setStep(2);
          t = setTimeout(() => {
            if (!mounted) return;
            loop();
          }, 3800);
        }, 2200);
      }, 1500);
    };
    loop();
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, []);

  return (
    <section
      id="find-proof"
      className="relative overflow-hidden border-t bg-gradient-to-br from-violet-100/70 via-purple-50 to-fuchsia-50/40 py-16 md:py-24"
    >
      {/* Ambient blobs — subtle depth, no motion, pure CSS. Palette
          pulled from the Testimoni icon: violet + purple with a
          hint of lavender. */}
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2 md:gap-16">
        {/* Left column — copy + CTA */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-600/30 bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
            <Sparkles className="h-3 w-3" /> New · Free · No signup
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Find the customer proof{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
              you already have,
            </span>{" "}
            in 30 seconds.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Paste your website. We scan{" "}
            <span className="font-semibold text-foreground">X, Reddit, LinkedIn, Product Hunt, App Store, G2</span>
            {" "}& more for real customer love — <em>before</em> you ever send a form.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/tools/find-my-proof"
              onClick={() => track("home_wedge_banner_cta", { placement: "section1" })}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30 md:text-base"
            >
              <Search className="h-4 w-4" />
              Paste your website — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {/* Secondary "just get me to the product" path — for
                visitors who already know they want a wall and don't
                need the auto-find flourish. */}
            <Link
              href="/signup?src=home_hero"
              onClick={() =>
                track("home_wedge_banner_signup_cta", { placement: "section1" })
              }
              className="group inline-flex items-center gap-1.5 rounded-full border-2 border-violet-600/30 bg-white px-5 py-3 text-sm font-bold text-violet-700 transition-all hover:-translate-y-0.5 hover:border-violet-600 hover:shadow-md md:text-base"
            >
              Show me my wall
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card · 10 testimonials free forever · Live in ~30 seconds
          </p>

          {/* Sources strip */}
          <div className="mt-10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              We look everywhere your customers talk
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <SourceChip icon={Twitter} label="X" />
              <SourceChip icon={Linkedin} label="LinkedIn" />
              <SourceChip icon={MessageCircle} label="Reddit" />
              <SourceChip icon={Trophy} label="Product Hunt" />
              <SourceChip icon={Zap} label="Hacker News" />
              <SourceChip icon={Star} label="App Store" />
              <SourceChip icon={Award} label="G2" />
              <SourceChip icon={Newspaper} label="Blogs" />
            </div>
          </div>
        </div>

        {/* Right column — animated mockup */}
        <div className="relative">
          <FindProofMockup step={step} typed={typed} quote={HERO_QUOTE} />
        </div>
      </div>
    </section>
  );
}

function SourceChip({ icon: Icon, label }: { icon: typeof Twitter; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// ─── Mockup ──────────────────────────────────────────────────────

interface Quote {
  content: string;
  author: string;
  role: string;
  score: number;
  source: string;
}

function FindProofMockup({
  step,
  typed,
  quote,
}: {
  step: 0 | 1 | 2;
  typed: string;
  quote: Quote;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  // Only start the count-up once the mockup enters viewport — avoids
  // wasted rAF while the section is offscreen.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setInView(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const count = useCountUp(37, 900, inView && step >= 1);

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl border border-violet-200/70 bg-white/90 p-4 shadow-2xl shadow-violet-500/10 backdrop-blur md:p-5"
    >
      {/* Fake browser chrome */}
      <div className="mb-3 flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <div className="ml-3 flex-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
          testimoni.io/tools/find-my-proof
        </div>
      </div>

      {/* URL bar */}
      <div className="flex items-center gap-2 rounded-2xl border-2 border-violet-200 bg-white p-2 pl-3 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-violet-500" />
        <div className="flex-1 text-sm text-slate-700">
          {typed}
          <span
            className={`ml-0.5 inline-block h-4 w-[1.5px] bg-slate-400 align-middle ${
              step === 0 ? "animate-pulse" : "opacity-0"
            }`}
          />
        </div>
        <div className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1 text-[10px] font-bold text-white">
          Find my proof
        </div>
      </div>

      {/* Results — reveals on step 1 + 2 */}
      <div
        className={`mt-4 transition-all duration-500 ${
          step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          ✨ Found it
        </div>
        <p className="mt-2 text-lg font-bold leading-snug md:text-xl">
          We found{" "}
          <span className="text-violet-600 tabular-nums">{count}</span>{" "}
          potential testimonials for{" "}
          <span className="text-violet-600">Acme</span>
        </p>

        {/* Source rows — cascade in with staggered delay */}
        <ul className="mt-3 space-y-1.5">
          {SOURCE_ROWS.map((row, i) => {
            const Icon = row.icon;
            return (
              <li
                key={row.label}
                className={`flex items-center gap-2 rounded-lg border bg-white/80 px-2.5 py-1.5 text-xs transition-all duration-300 ${
                  step >= 1
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2"
                }`}
                style={{ transitionDelay: `${300 + i * 120}ms` }}
              >
                <span className="text-red-500">❤️</span>
                <Icon className={`h-3.5 w-3.5 ${row.color}`} />
                <span className="font-bold tabular-nums">{row.count}</span>
                <span className="text-muted-foreground">{row.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Featured quote — reveals on step 2 */}
      <div
        className={`mt-4 rounded-2xl border-2 border-violet-100 bg-gradient-to-br from-violet-50/60 to-white p-4 transition-all duration-500 ${
          step >= 2
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-violet-700">
          <Twitter className="h-3 w-3" />
          via {quote.source} · {quote.score}/100
        </div>
        <p className="text-sm italic leading-relaxed text-slate-800">
          &ldquo;{quote.content}&rdquo;
        </p>
        <div className="mt-2 flex items-center gap-2 border-t pt-2 text-xs">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-[10px] font-bold text-white">
            N
          </div>
          <div>
            <p className="font-semibold">{quote.author}</p>
            <p className="text-[10px] text-muted-foreground">{quote.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
