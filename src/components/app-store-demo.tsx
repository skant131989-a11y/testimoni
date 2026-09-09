"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/letter-avatar";
import { track } from "@/lib/analytics";

/**
 * Auto-looping review-source demo. Mirrors ScreenshotDemo's phase
 * cycle so the two feel like siblings.
 *
 * Each cycle:
 *   1. show    (2.4s) — fake App Store / Play Store / Chrome Store /
 *                       Product Hunt URL bar with a subtle typing
 *                       animation on the URL string.
 *   2. extract (1.0s) — "Fetching reviews…" spinner card.
 *   3. reveal  (3.4s) — three real-looking star-rated review cards
 *                       cascade in with a stagger.
 *
 * Zero API calls — every review is hand-authored static data. Same
 * abuse-safe pattern as ScreenshotDemo.
 */

interface Platform {
  key: "app_store" | "play_store" | "chrome_store" | "product_hunt";
  chip: string;
  accentBg: string;
  accentText: string;
  urlHost: string;
  urlPath: string;
  appName: string;
  aggregate: { rating: number; count: string };
}

interface Review {
  author: string;
  handle: string;
  rating: number;
  content: string;
  avatarColor: string;
}

interface Example {
  platform: Platform;
  reviews: readonly [Review, Review, Review];
}

const EXAMPLES: readonly Example[] = [
  {
    platform: {
      key: "app_store",
      chip: "App Store",
      accentBg: "bg-blue-500",
      accentText: "text-blue-600",
      urlHost: "apps.apple.com",
      urlPath: "/us/app/notion/id1232780281",
      appName: "Notion — Notes, Docs, Tasks",
      aggregate: { rating: 4.8, count: "289.4k" },
    },
    reviews: [
      {
        author: "Rachel K.",
        handle: "rk_notes",
        rating: 5,
        content: "Cut my onboarding docs from 3 days to 4 hours. Team actually reads them now.",
        avatarColor: "bg-emerald-500",
      },
      {
        author: "Marcus C.",
        handle: "growth_marcus",
        rating: 5,
        content: "The fastest playbook we've rolled out at a 200-person startup this year.",
        avatarColor: "bg-fuchsia-500",
      },
      {
        author: "Aditi P.",
        handle: "aditi_p",
        rating: 5,
        content: "Been meaning to switch from Docs for a year. Finally did it. Wish I had sooner.",
        avatarColor: "bg-amber-500",
      },
    ] as const,
  },
  {
    platform: {
      key: "play_store",
      chip: "Play Store",
      accentBg: "bg-emerald-500",
      accentText: "text-emerald-600",
      urlHost: "play.google.com",
      urlPath: "/store/apps/details?id=com.spotify.music",
      appName: "Spotify — Music & Podcasts",
      aggregate: { rating: 4.7, count: "31.2M" },
    },
    reviews: [
      {
        author: "Jamal T.",
        handle: "jamal.t",
        rating: 5,
        content: "The Discover Weekly is genuinely uncanny — every Monday feels like Christmas.",
        avatarColor: "bg-orange-500",
      },
      {
        author: "Priya S.",
        handle: "priya.singh",
        rating: 4,
        content: "Ten years in and it still improves quietly every month. Rare in tech.",
        avatarColor: "bg-indigo-500",
      },
      {
        author: "Chen W.",
        handle: "chen.w",
        rating: 5,
        content: "Podcast + music in one app that actually works. Been paying for two years.",
        avatarColor: "bg-rose-500",
      },
    ] as const,
  },
  {
    platform: {
      key: "chrome_store",
      chip: "Chrome Web Store",
      accentBg: "bg-yellow-500",
      accentText: "text-yellow-700",
      urlHost: "chromewebstore.google.com",
      urlPath: "/detail/1password/aeblfdkhhhdcdjpifhhbdiojplfjncoa",
      appName: "1Password — Password Manager",
      aggregate: { rating: 4.9, count: "12,847" },
    },
    reviews: [
      {
        author: "Diego M.",
        handle: "diego.m",
        rating: 5,
        content: "Autofill just works — every site, every browser. Something Chrome's built-in never nailed.",
        avatarColor: "bg-sky-500",
      },
      {
        author: "Lena F.",
        handle: "lena_f",
        rating: 5,
        content: "Switched from LastPass after the breach. Setup took 5 min, been 100% smoother since.",
        avatarColor: "bg-teal-500",
      },
      {
        author: "Sam O.",
        handle: "sam.oh",
        rating: 5,
        content: "Family plan is the best money I spend on software. Bought it for the whole team too.",
        avatarColor: "bg-violet-500",
      },
    ] as const,
  },
  {
    platform: {
      key: "product_hunt",
      chip: "Product Hunt",
      accentBg: "bg-orange-500",
      accentText: "text-orange-600",
      urlHost: "producthunt.com",
      urlPath: "/products/linear",
      appName: "Linear — Issue tracking",
      aggregate: { rating: 4.9, count: "4,231" },
    },
    reviews: [
      {
        author: "Kira N.",
        handle: "kira.n",
        rating: 5,
        content: "The keyboard-first UX finally makes issue tracking feel like magic, not chores.",
        avatarColor: "bg-cyan-500",
      },
      {
        author: "Owen B.",
        handle: "owen.b",
        rating: 5,
        content: "Fastest app I use daily. Every interaction respects my time. Rare.",
        avatarColor: "bg-lime-500",
      },
      {
        author: "Marta L.",
        handle: "marta.l",
        rating: 5,
        content: "Moved a 40-person team over. No one asked to go back. Migration was one afternoon.",
        avatarColor: "bg-red-500",
      },
    ] as const,
  },
];

const PHASE_DURATIONS = { show: 2400, extract: 1000, reveal: 3400 } as const;
const CYCLE_MS = Object.values(PHASE_DURATIONS).reduce((a, b) => a + b, 0);

type Phase = "show" | "extract" | "reveal";

export function AppStoreDemo() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("show");
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    track("app_store_demo_viewed", {}, { anonymous: true });
  }, []);

  useEffect(() => {
    let mounted = true;
    setPhase("show");
    const t1 = setTimeout(() => mounted && setPhase("extract"), PHASE_DURATIONS.show);
    const t2 = setTimeout(
      () => mounted && setPhase("reveal"),
      PHASE_DURATIONS.show + PHASE_DURATIONS.extract,
    );
    const advance = setTimeout(() => {
      if (!mounted) return;
      setExampleIdx((i) => (i + 1) % EXAMPLES.length);
    }, CYCLE_MS);
    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(advance);
    };
  }, [exampleIdx]);

  const ex = EXAMPLES[exampleIdx];

  return (
    <div className="relative w-full">
      {/* Header + platform indicator dots */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${ex.platform.accentText}`}>
          <span className={`inline-block h-2 w-2 animate-pulse rounded-full ${ex.platform.accentBg}`} />
          Live demo · {ex.platform.chip}
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

      {/* Card */}
      <div className="rounded-2xl border-2 border-primary/15 bg-card p-4 shadow-md">
        {/* URL bar mock */}
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${ex.platform.accentBg} text-[10px] font-black text-white`}>
            {ex.platform.chip.charAt(0)}
          </div>
          <span className="truncate font-mono text-muted-foreground">
            {ex.platform.urlHost}
            <span className="text-foreground">{ex.platform.urlPath}</span>
          </span>
        </div>

        {/* App name + aggregate rating */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{ex.platform.appName}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
                {ex.platform.aggregate.rating}
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </span>
              <span>· {ex.platform.aggregate.count} reviews</span>
            </div>
          </div>
          <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Import
          </div>
        </div>

        {/* Extract / reveal area */}
        <div className="mt-4 min-h-[240px] rounded-xl bg-muted/40 p-3">
          {phase === "show" && (
            <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
              <div className="text-xs font-medium text-muted-foreground">
                Ready to import
              </div>
              <div className="text-xs text-muted-foreground">
                Click Import to pull top reviews into your Wall of Love.
              </div>
            </div>
          )}
          {phase === "extract" && (
            <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs font-medium text-foreground">
                Fetching reviews from {ex.platform.chip}…
              </p>
              <div className="w-40 overflow-hidden rounded-full bg-muted">
                <div className="h-1 w-2/3 animate-pulse rounded-full bg-primary" />
              </div>
            </div>
          )}
          {phase === "reveal" && (
            <ul className="space-y-2">
              {ex.reviews.map((r, i) => (
                <li
                  key={i}
                  className="rounded-lg border bg-background p-2.5 opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-500"
                  style={{
                    animationDelay: `${i * 200}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <LetterAvatar
                      name={r.author}
                      className={`h-7 w-7 shrink-0 text-[10px] ${r.avatarColor} text-white`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold">{r.author}</p>
                        <div className="flex shrink-0 items-center gap-0.5">
                          {[...Array(5)].map((_, s) => (
                            <Star
                              key={s}
                              className={`h-2.5 w-2.5 ${
                                s < r.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-foreground/80">
                        {r.content}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          Works with App Store, Play Store, Chrome Web Store, Product Hunt.
        </p>
        <Link href="/signup?src=hero_app_store">
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
            Try it free <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
