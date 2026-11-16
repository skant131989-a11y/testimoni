"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";

interface ProductState {
  state: "needs_url" | "dismissed" | "scanning" | "ready";
  websiteUrl: string | null;
  suggestedDomain: string | null;
  praiseCount: number;
  scanId: string | null;
  notify: boolean;
}

const SEEN_KEY = "mentions_banner_dismissed";

/**
 * Asks once for the product URL (prefilled when the signup email is a
 * work domain), kicks off the background scan, then tells the owner how
 * much public praise was found.
 *
 * Where it shows (it used to sit above every dashboard page and every
 * public page, which was noise):
 *  - the question and the "looking…" note: dashboard home only;
 *  - the "we found N mentions" result: dashboard home and Testimonials,
 *    where "Review & add to my wall" leads. It has its own dismiss.
 */
export function MentionsBanner({
  where = "testimonials",
  fallback,
}: {
  /** "home": rendered by the dashboard page itself, under the heading.
   *  "testimonials": the layout's copy, which only shows the result strip
   *  on the Testimonials pages. */
  where?: "home" | "testimonials";
  /** Shown on the home page whenever there is nothing to ask or report
   *  (so the dashboard shows this banner OR the Find my proof card). */
  fallback?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const onHome = where === "home";
  const onTestimonials =
    where === "testimonials" &&
    (pathname === "/dashboard/testimonials" || pathname.startsWith("/dashboard/testimonials/"));
  const [data, setData] = useState<ProductState | null>(null);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const pollsRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/product", { cache: "no-store" });
      if (!res.ok) return;
      setData((await res.json()) as ProductState);
    } catch {
      // Banner is optional — fail quietly.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/workspace/product", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (body && !cancelled) setData(body as ProductState);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // While a scan runs, poll every 6s (max ~2 min) for the result.
  useEffect(() => {
    if (data?.state !== "scanning") return;
    const t = setInterval(() => {
      pollsRef.current += 1;
      if (pollsRef.current > 20) clearInterval(t);
      else void load();
    }, 6000);
    return () => clearInterval(t);
  }, [data?.state, load]);

  const dismissedKey = data?.scanId ? `${data.scanId}:${data.praiseCount}` : null;
  const alreadyDismissed = (() => {
    if (!dismissedKey) return false;
    try {
      return localStorage.getItem(SEEN_KEY) === dismissedKey;
    } catch {
      return false;
    }
  })();

  if (!data) return null;
  if (hidden) return onHome ? <>{fallback}</> : null;

  async function saveUrl(e: React.FormEvent) {
    e.preventDefault();
    const value = (url || data?.suggestedDomain || "").trim();
    if (!value) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace/product", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ websiteUrl: value }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Couldn't save that.");
        return;
      }
      track("product_url_saved", { source: data?.suggestedDomain ? "prefill_or_typed" : "typed" });
      pollsRef.current = 0;
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function dismissPrompt() {
    setHidden(true);
    await fetch("/api/workspace/product", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dismiss: true }),
    }).catch(() => {});
  }

  if (data.state === "needs_url") {
    if (!onHome) return null;
    return (
      <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <form onSubmit={saveUrl} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            What&apos;s your product&apos;s website? We&apos;ll look for customers already praising it.
          </div>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={data.suggestedDomain ?? "yourproduct.com"}
            className="h-9 max-w-xs bg-background"
            aria-label="Product website"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving || (!url.trim() && !data.suggestedDomain)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find mentions"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={dismissPrompt}>
              Not now
            </Button>
          </div>
        </form>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  if (data.state === "scanning") {
    if (!onHome) return null;
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Looking for public mentions of {data.websiteUrl ?? "your product"}…
      </div>
    );
  }

  if (data.state === "ready" && data.notify && data.scanId && !alreadyDismissed && (onHome || onTestimonials)) {
    return (
      <div className="mb-4 flex flex-col gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-emerald-900">
          We found {data.praiseCount} public mentions praising {data.websiteUrl ?? "your product"} on X, Reddit and
          LinkedIn.
        </span>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link
              href={`/tools/customer-voice/${data.scanId}`}
              onClick={() => track("mentions_banner_clicked", { praiseCount: data.praiseCount })}
            >
              Review &amp; add to my wall
            </Link>
          </Button>
          <button
            type="button"
            aria-label="Dismiss"
            className="rounded p-1 text-emerald-900/70 hover:bg-emerald-100"
            onClick={() => {
              try {
                if (dismissedKey) localStorage.setItem(SEEN_KEY, dismissedKey);
              } catch {}
              setHidden(true);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Nothing to ask or report (prompt dismissed, nothing found, result
  // already dismissed): on the home page show the fallback card instead.
  return onHome ? <>{fallback}</> : null;
}
