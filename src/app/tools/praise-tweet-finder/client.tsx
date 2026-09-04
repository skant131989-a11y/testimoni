"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Search,
  Heart,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import { TweetPreviewDemo } from "@/components/tweet-preview-demo";

/**
 * Praise Tweet Finder — search-URL builder.
 *
 * We do NOT touch X's API. Instead we build smart Google + X search
 * URLs from the user's handle and their chosen positive-sentiment
 * keywords. The user searches in their own browser, finds a praise
 * tweet, comes back, and pastes it into Testimoni's paste-a-tweet
 * flow (which happens at signup).
 *
 * Why this shape:
 * - Zero X API usage → no X Developer app, no OAuth, no rate limits
 * - Zero storage of X data → no terms-of-service exposure
 * - Actually works for any handle immediately (no signup required)
 * - Preserves the SEO wedge for "find praise tweets" queries
 * - Same signup funnel — user pastes their found tweet at signup
 */

const KEYWORDS = [
  "love",
  "amazing",
  "recommend",
  "incredible",
  "best",
  "fantastic",
  "obsessed",
  "gamechanger",
  "highly recommend",
  "10/10",
] as const;

type Keyword = (typeof KEYWORDS)[number];

const DEFAULT_KEYWORDS: Keyword[] = ["love", "amazing", "recommend"];

export function PraiseTweetFinderClient() {
  const [handle, setHandle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_KEYWORDS));

  /**
   * Normalize the handle the user typed. We strip common decorations
   * (@, whitespace, trailing slashes, x.com/twitter.com URLs the user
   * may have pasted in by mistake) so the search query is clean.
   */
  function normalizeHandle(raw: string): string {
    let h = raw.trim();
    // If they pasted a profile URL, keep only the last segment
    const urlMatch = h.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)/i);
    if (urlMatch) h = urlMatch[1];
    // Strip leading @
    if (h.startsWith("@")) h = h.slice(1);
    return h;
  }

  const cleanedHandle = normalizeHandle(handle);
  const hasHandle = cleanedHandle.length > 0;
  const hasKeywords = selected.size > 0;
  const canSearch = hasHandle && hasKeywords;

  const keywordUnion = Array.from(selected)
    .map((k) => `"${k}"`)
    .join(" OR ");

  // X's own advanced search. `to:handle` catches replies to the user;
  // combined with an OR of positive keywords this surfaces the actual
  // praise tweets, not just any mentions. We use X directly (not Google
  // site:x.com) because Google's index of tweets is unreliable since
  // 2023 — Musk has toggled Googlebot access repeatedly, so reply
  // tweets in particular are poorly indexed. X's own search is the
  // source of truth here.
  const xQuery = canSearch
    ? `to:${cleanedHandle} (${keywordUnion}) filter:replies`
    : "";
  const xUrl = canSearch
    ? `https://x.com/search?q=${encodeURIComponent(xQuery)}&f=live`
    : "#";

  function toggleKeyword(k: Keyword) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function fireSearch(url: string) {
    track("praise_finder_search_clicked", {
      handle: cleanedHandle,
      keyword_count: selected.size,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={28}
              height={28}
              className="rounded-full"
            />
            <span className="text-xl font-bold">Testimoni</span>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Free · No signup · No X login
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Find praise tweets about your work.
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-muted-foreground">
            For founders, creators &amp; freelancers.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Enter your @handle, pick the words you want to search for, and
            we&apos;ll open X with a smart query built for you. We don&apos;t
            store anything — you find your own tweets, you decide which to
            save.
          </p>
        </div>

        {/* Search builder */}
        <div className="mt-10 space-y-5 rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-6">
          <div>
            <label htmlFor="handle" className="text-sm font-semibold">
              Your @handle
            </label>
            <div className="mt-1.5 flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="yourbrand"
                className="rounded-l-none"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            {handle && cleanedHandle !== handle.trim() && (
              <p className="mt-1 text-xs text-muted-foreground">
                Searching for <span className="font-mono">@{cleanedHandle}</span>
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold">Words that mean &ldquo;praise&rdquo;</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pick as many as you like — we&apos;ll search for tweets that
              contain any of them.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {KEYWORDS.map((k) => {
                const active = selected.has(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleKeyword(k)}
                    className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Heart
                      className={
                        active ? "h-3 w-3 fill-current" : "h-3 w-3 opacity-40"
                      }
                    />
                    {k}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single primary search button — X only. Dropped the
              Google option: since 2023 Google's index of tweets has
              been unreliable, and reply tweets (where praise usually
              lives) are especially poorly indexed. One obvious action
              beats two competing ones. */}
          <Button
            size="lg"
            disabled={!canSearch}
            onClick={() => fireSearch(xUrl)}
            className="w-full gap-2"
          >
            <Search className="h-4 w-4" />
            Search on X
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </Button>

          {!hasHandle && (
            <p className="text-center text-xs text-muted-foreground">
              Enter your @handle above to enable search.
            </p>
          )}

          {/* Show the actual query we'll run — transparency */}
          {canSearch && (
            <details className="rounded-lg border bg-background/60 p-3 text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground">
                What are we searching for?
              </summary>
              <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                <span className="text-primary">X search:</span> {xQuery}
              </div>
            </details>
          )}
        </div>

        {/* How it works */}
        <div className="mt-14">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            How it works
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                num: "1",
                title: "Search",
                body: "Enter your handle. Pick praise keywords. We open X with a smart query built just for you.",
              },
              {
                num: "2",
                title: "Find & copy",
                body: "Scroll the results. Copy the URL of a tweet you like. Nothing gets stored on our servers.",
              },
              {
                num: "3",
                title: "Save",
                body: "Paste the URL into Testimoni. It becomes a live testimonial on your Wall of Love.",
              },
            ].map((s) => (
              <div key={s.num} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {s.num}
                </div>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save the tweet → signup bridge */}
        <div className="mt-14 rounded-2xl border-2 border-primary/30 bg-primary/5 p-8">
          <div className="mb-6 text-center">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Found a good one?
            </div>
            <h2 className="text-2xl font-bold">
              Paste it here to save.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ll pull the author, text, and rating right now — no
              signup needed. Sign up when you like what you see.
            </p>
          </div>

          {/* Live paste-a-URL demo — same component used on the home
              page. Anonymous, hits /api/tweet-preview, shows the tweet
              rendered as a testimonial card. On "Save", stashes the
              preview in sessionStorage and routes to signup so the
              welcome page can auto-import. */}
          <div className="mx-auto max-w-md">
            <TweetPreviewDemo />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Or{" "}
            <Link
              href="/signup?tool=praise-tweet-finder"
              onClick={() => track("praise_finder_signup_direct")}
              className="font-semibold text-primary hover:underline"
            >
              sign up first
            </Link>{" "}
            and paste from the dashboard.
          </p>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to Testimoni
          </Link>
          <p>Free tool. No signup needed to search.</p>
        </div>
      </footer>
    </div>
  );
}
