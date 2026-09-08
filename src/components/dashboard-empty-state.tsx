"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, ArrowRight, Loader2, Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { celebrateFirstTestimonial } from "@/lib/confetti";
import { track } from "@/lib/analytics";

/**
 * Dashboard empty state — 2-column: left has the CTA, right shows
 * a real mock wall. Actions are INLINE — pasting a URL and copying
 * the form link both happen on this component without navigating
 * to /dashboard/import or /dashboard/collect. Faster to first
 * testimonial: paste URL → import success → confetti + auto-
 * refresh reveals the testimonial in the recent list above.
 *
 * The mock cards use real Testimoni testimonials so the "your wall
 * will look like this" pitch is real social proof AS empty state.
 */

const MOCK = [
  {
    quote:
      "Hi Neha, I was checking out your platform today, really good and clean. Removes the need to build a custom review database.",
    name: "Prince B",
    title: "SaaS founder",
    color: "bg-purple-500",
  },
  {
    quote:
      "No-login, paste-anywhere tools are exactly what gets used vs bookmarked and forgotten.",
    name: "Josh Builds",
    title: "Indie hacker",
    color: "bg-pink-500",
  },
  {
    quote:
      "That homepage-to-card speed holds up. No lag between paste and preview.",
    name: "octaviamotiondesigns",
    title: "Designer",
    color: "bg-amber-500",
  },
];

interface Props {
  /** Full absolute form URL to copy when the user clicks "Share
   *  your form" — pre-built server-side so this component doesn't
   *  need to know the origin. Null if no form exists yet (rare —
   *  provisioning creates one on signup). */
  formUrl: string | null;
}

export function DashboardEmptyState({ formUrl }: Props) {
  const router = useRouter();

  // Which panel is expanded — "cta" is the default 2-button layout;
  // "paste" swaps in an inline URL input; "share" swaps in a copy-
  // to-clipboard row with the form URL.
  const [mode, setMode] = useState<"cta" | "paste" | "share">("cta");

  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  async function handleImport() {
    if (!url.trim()) return;
    setImporting(true);
    setError(null);
    track("dashboard_empty_paste_submitted");
    try {
      const res = await fetch("/api/testimonials/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't import that URL.");
        track("dashboard_empty_paste_failed", { status: res.status });
        return;
      }
      // Confetti celebration + refresh — the recent-testimonials
      // list re-queries on the server round-trip, so the newly
      // imported card appears above without a manual reload.
      celebrateFirstTestimonial();
      track("dashboard_empty_paste_succeeded");
      router.refresh();
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setImporting(false);
    }
  }

  async function handleCopyForm() {
    if (!formUrl) return;
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      track("dashboard_empty_form_copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent — clipboard perms denied, they can still click the
      // Preview link below.
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-purple-50/40 to-pink-50/40">
      <div className="grid gap-8 p-6 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-10 md:p-10">
        {/* Left — CTA / paste-inline / share-inline. All three modes
            occupy the same slot; only the active one renders. */}
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            🩷 Your wall preview
          </div>

          {mode === "cta" && (
            <>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Paste a customer tweet to make it yours.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Real testimonial in 30 seconds. Any X, LinkedIn,
                Reddit, Hacker News, or Product Hunt URL — we pull
                the author and text automatically.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => setMode("paste")}
                >
                  Paste your first tweet <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setMode("share")}
                  disabled={!formUrl}
                >
                  Share your form
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Every wall starts empty — pick one from the sample on
                the right, or paste your own.
              </p>
            </>
          )}

          {mode === "paste" && (
            <>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                Paste any public post URL
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                X, LinkedIn, Reddit, Hacker News, or Product Hunt.
                We&apos;ll import it as an approved testimonial.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Input
                  type="url"
                  autoFocus
                  placeholder="https://x.com/user/status/…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleImport()}
                  disabled={importing}
                  className="font-mono text-xs sm:text-sm"
                />
                <Button
                  onClick={handleImport}
                  disabled={importing || !url.trim()}
                  className="shrink-0"
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing
                    </>
                  ) : (
                    <>
                      Import <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-destructive" role="alert">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setMode("cta");
                  setError(null);
                  setUrl("");
                }}
                className="mt-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            </>
          )}

          {mode === "share" && formUrl && (
            <>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                Send this link to a customer
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Every reply lands in your inbox for one-click
                approval before it hits your wall.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <div className="min-w-0 flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs">
                  {formUrl}
                </div>
                <Button
                  onClick={handleCopyForm}
                  className="shrink-0 gap-1.5"
                  variant={copied ? "default" : "outline"}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy link
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Preview <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setMode("cta")}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right — real mock wall, fully visible. Uses actual
            Testimoni testimonials so it's real social proof AS
            the empty state. */}
        <div className="relative">
          <div className="absolute -top-3 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-md">
            <Star className="h-3 w-3 fill-current" /> Sample wall
          </div>
          <div className="space-y-3 rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-xl">
            {MOCK.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg border bg-background p-3 ${
                  i === 1 ? "ml-4" : ""
                }`}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="h-3 w-3 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-foreground line-clamp-3">
                  &ldquo;{m.quote}&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-2 border-t pt-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${m.color}`}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Illustrative — your wall will show your own testimonials.
          </p>
        </div>
      </div>
    </div>
  );
}
