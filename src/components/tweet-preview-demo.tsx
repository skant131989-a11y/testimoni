"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Sparkles, Link2, Code } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/letter-avatar";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

interface PreviewResult {
  content: string;
  customerName: string;
  customerUrl?: string | null;
  source: "TWITTER" | "LINKEDIN";
  sourceUrl: string;
}

interface TweetPreviewDemoProps {
  /** Passed from the parent server component. When true, "Save to my
   *  Wall" skips the signup redirect and imports directly. */
  isLoggedIn?: boolean;
}

/**
 * Live paste-a-tweet demo. Anonymous visitors get a "wait, it works"
 * moment before signup; logged-in visitors can save the imported
 * testimonial directly to their workspace without leaving.
 */
export function TweetPreviewDemo({ isLoggedIn = false }: TweetPreviewDemoProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [savingLoggedIn, setSavingLoggedIn] = useState(false);
  // Guard so we only fire tweet_preview_pasted once per session.
  const [pastedTracked, setPastedTracked] = useState(false);

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    if (pastedTracked) return;
    const pastedText = e.clipboardData.getData("text").trim();
    if (!pastedText) return;
    setPastedTracked(true);
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
      const preview: PreviewResult = data.testimonial;
      setResult(preview);
      // Stash BOTH the URL and the full preview so the welcome page
      // can render the imported card instantly without re-fetching
      // (skips the "Importing..." loader flash after signup).
      try {
        sessionStorage.setItem("pending_import_url", url.trim());
        sessionStorage.setItem("pending_import_preview", JSON.stringify(preview));
      } catch {}
      track("tweet_preview_success", {
        source: "home_hero",
        platform: preview.source,
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
      previous_platform: result?.source ?? null,
    });
    setResult(null);
    setUrl("");
    setError(null);
    setPastedTracked(false);
  }

  /**
   * Logged-in "Save to my Wall": call the authenticated import
   * endpoint directly, then land the user on the welcome page's
   * success screen. sessionStorage already holds the preview so
   * welcome renders instantly without another API round-trip.
   */
  async function handleSaveWhileLoggedIn() {
    if (!result || savingLoggedIn) return;
    setSavingLoggedIn(true);
    setError(null);
    track("tweet_preview_save_cta", {
      source: "home_hero",
      platform: result.source,
      auth: "logged_in",
    });
    try {
      const res = await fetch("/api/testimonials/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.sourceUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save. Try again.");
        setSavingLoggedIn(false);
        return;
      }
      // Success — welcome page will read sessionStorage and render
      // the imported card immediately (see welcome-client.tsx).
      window.location.assign("/dashboard/welcome");
    } catch {
      setError("Network error. Try again in a moment.");
      setSavingLoggedIn(false);
    }
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
            Preview — save it to make it live
          </>
        ) : (
          <>
            <ArrowRight className="h-3.5 w-3.5" />
            Example — paste a URL to try it
          </>
        )}
      </div>

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

            {/* Benefit stack + CTA. Sells both wedges (wall URL + embed)
                in the same card so the single button converts whether
                the user cares about sharing a link or embedding code. */}
            <div className="mt-4 space-y-2 border-t pt-3">
              <p className="text-[11px] font-semibold text-foreground">
                Save it to get:
              </p>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Link2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span>
                    A public <span className="font-medium text-foreground">Wall of Love URL</span>{" "}
                    — share in bios, DMs, or a QR code
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Code className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium text-foreground">One-line embed</span>{" "}
                    for your site — Framer, Webflow, WordPress, React
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={reset}
                disabled={savingLoggedIn}
                className="order-2 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 sm:order-1"
              >
                ← Try another URL
              </button>
              {isLoggedIn ? (
                <Button
                  size="sm"
                  onClick={handleSaveWhileLoggedIn}
                  disabled={savingLoggedIn}
                  className="order-1 sm:order-2"
                >
                  {savingLoggedIn ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      Save to my Wall <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  asChild
                  onClick={() =>
                    track("tweet_preview_save_cta", {
                      source: "home_hero",
                      platform: result.source,
                      auth: "logged_out",
                    })
                  }
                  className="order-1 sm:order-2"
                >
                  <a href="/signup?import=1">
                    Save to my Wall <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>

            <p className="mt-2 text-center text-[10px] text-muted-foreground sm:text-right">
              Free forever · No card required
            </p>
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
