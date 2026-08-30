"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/letter-avatar";
import { track } from "@/lib/analytics";

interface PreviewResult {
  content: string;
  customerName: string;
  customerUrl?: string | null;
  source: "TWITTER" | "LINKEDIN";
  sourceUrl: string;
}

/**
 * Live paste-a-tweet demo for the homepage. Anonymous visitor pastes
 * an X or LinkedIn URL, we call /api/tweet-preview, then swap the
 * static Sarah Chen card for their imported testimonial. Zero signup
 * required — the goal is the "wait, it actually works" moment.
 */
export function TweetPreviewDemo() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);
  // Guard so we only fire tweet_preview_pasted once per session — a
  // user pasting multiple times in a row shouldn't spam the funnel.
  const [pastedTracked, setPastedTracked] = useState(false);

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    if (pastedTracked) return;
    const pastedText = e.clipboardData.getData("text").trim();
    if (!pastedText) return;
    setPastedTracked(true);
    // Best-effort platform detection from the pasted string, so we can
    // segment the funnel by source even before Import is clicked.
    const platform = /(?:twitter|x)\.com\/[^/]+\/status\/\d+/i.test(pastedText)
      ? "twitter"
      : /linkedin\.com\/(feed\/update|posts|pulse)/i.test(pastedText)
        ? "linkedin"
        : "unknown";
    track("tweet_preview_pasted", { source: "home_hero", platform });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    track("tweet_preview_submitted", { source: "home_hero" });
    try {
      const res = await fetch("/api/tweet-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try another URL.");
        track("tweet_preview_failed", { source: "home_hero", status: res.status });
        return;
      }
      setResult(data.testimonial);
      // Stash the URL so the welcome page can auto-import it into the
      // user's fresh workspace after signup — turns "cool demo" into
      // "your first testimonial is already saved" on landing.
      try {
        sessionStorage.setItem("pending_import_url", url.trim());
      } catch {}
      track("tweet_preview_success", {
        source: "home_hero",
        platform: data.testimonial.source,
      });
    } catch {
      setError("Network error. Try again in a moment.");
      track("tweet_preview_failed", { source: "home_hero", status: 0 });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    track("tweet_preview_try_another", {
      source: "home_hero",
      // Track which platform they're coming FROM — helps see if
      // people bounce between X and LinkedIn.
      previous_platform: result?.source ?? null,
    });
    setResult(null);
    setUrl("");
    setError(null);
    setPastedTracked(false);
  }

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="mb-2 text-xs text-muted-foreground">
          Paste a public X or LinkedIn post URL
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            inputMode="url"
            placeholder="https://x.com/user/status/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            disabled={loading}
            className="font-mono text-xs sm:text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading || !url.trim()}
            className="shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Importing
              </>
            ) : (
              <>
                Import <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>

      {error && (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="my-3 flex items-center gap-2 text-[11px] font-medium text-primary">
        {result ? (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Approved &amp; ready to embed
          </>
        ) : (
          <>
            <ArrowRight className="h-3.5 w-3.5" />
            Approved &amp; live on your wall
          </>
        )}
      </div>

      {/* Result card — shows the imported testimonial OR a static example
          before the user pastes anything. */}
      <div className="rounded-md border bg-background p-3">
        {result ? (
          <>
            <div className="flex items-center gap-2">
              <LetterAvatar name={result.customerName} size={28} fontSize={11} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">
                  {result.customerName}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  via {result.source === "TWITTER" ? "X / Twitter" : "LinkedIn"}
                </div>
              </div>
            </div>
            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
              &ldquo;{result.content}&rdquo;
            </p>
            {/* Post-import conversion — this testimonial gets auto-saved
                to their new library on signup. Highest-intent moment on
                the whole page. */}
            <div className="mt-4 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={reset}
                className="order-2 text-[11px] font-medium text-muted-foreground hover:text-foreground sm:order-1"
              >
                ← Try another URL
              </button>
              <Button
                size="sm"
                asChild
                onClick={() =>
                  track("tweet_preview_save_cta", {
                    source: "home_hero",
                    platform: result.source,
                  })
                }
                className="order-1 sm:order-2"
              >
                <Link href="/signup?import=1">
                  Save to my Wall <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                S
              </div>
              <div className="text-xs font-semibold">Sarah Chen</div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              &ldquo;Testimoni turned a mess of tweets into a wall of love
              in about 30 seconds.&rdquo;
            </p>
          </>
        )}
      </div>
    </div>
  );
}
