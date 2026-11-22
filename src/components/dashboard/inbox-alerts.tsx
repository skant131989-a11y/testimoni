"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { celebrateFirstTestimonial } from "@/lib/confetti";

/**
 * Live alert for the dashboard. While you are logged in and the tab is open
 * it checks every 45 seconds (and when you come back to the tab) for new
 * submissions, and when one arrives it:
 *   - puts a count in the tab title, "(2) Testimoni", so you see it from
 *     another tab,
 *   - shows a card with who it is from and what they said, with Approve and
 *     Review buttons, so you can put it on your wall from any page.
 * Approving your very first testimonial gets a small celebration.
 */

type Latest = { id: string; name: string; snippet: string; rating: number | null };
type Payload = { pending: number; latest: Latest | null; hasTestimonials: boolean; wallUrl?: string | null };
type Toast =
  | { kind: "new"; latest: Latest; pending: number; first: boolean; wallUrl: string | null }
  | { kind: "approved"; name: string; first: boolean; wallUrl: string | null }
  | { kind: "error"; message: string };

const POLL_MS = 45_000;

export function InboxAlerts() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [busy, setBusy] = useState(false);
  const hoverRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());
  const baselineRef = useRef<boolean>(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/inbox/count", { cache: "no-store" });
      if (!res.ok) return;
      const d = (await res.json()) as Payload;
      setPending(d.pending);
      // The first reading is the baseline: it never pops a card for what was
      // already waiting when the page opened (the Inbox badge covers that).
      if (!baselineRef.current) {
        baselineRef.current = true;
        if (d.latest) seenRef.current.add(d.latest.id);
        return;
      }
      if (d.latest && !seenRef.current.has(d.latest.id)) {
        seenRef.current.add(d.latest.id);
        setToast({ kind: "new", latest: d.latest, pending: d.pending, first: !d.hasTestimonials, wallUrl: d.wallUrl ?? null });
        track("inbox_alert_shown", { pending: d.pending });
      }
    } catch {
      // Offline or a blip: try again next time.
    }
  }, []);

  useEffect(() => {
    void poll();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void poll();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("inbox-changed", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("inbox-changed", onVisible);
    };
  }, [poll]);

  // Tab title: "(2) Page title". Next resets the title on navigation, so it is
  // re-applied after each route change.
  useEffect(() => {
    const apply = () => {
      const clean = document.title.replace(/^\(\d+\)\s*/, "");
      document.title = pending > 0 ? `(${pending}) ${clean}` : clean;
    };
    apply();
    const t = setTimeout(apply, 400);
    return () => clearTimeout(t);
  }, [pending, pathname]);

  // Cards fade away on their own unless the mouse is on them.
  useEffect(() => {
    if (!toast) return;
    const t = setInterval(() => {
      if (!hoverRef.current) setToast(null);
    }, 15_000);
    return () => clearInterval(t);
  }, [toast]);

  async function approve(latest: Latest, first: boolean, wallUrl: string | null) {
    setBusy(true);
    try {
      const res = await fetch(`/api/submissions/${latest.id}/approve`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ kind: "error", message: body.error || "Couldn't approve that one. Open the inbox to try again." });
        return;
      }
      track("inbox_alert_approved", { first });
      if (first) celebrateFirstTestimonial();
      setToast({ kind: "approved", name: latest.name, first, wallUrl });
      window.dispatchEvent(new Event("inbox-changed"));
      router.refresh();
    } catch {
      setToast({ kind: "error", message: "Network hiccup. Open the inbox to approve it." });
    } finally {
      setBusy(false);
    }
  }

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] w-[min(22rem,calc(100vw-2rem))]"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-2xl shadow-violet-500/20">
        <div className="flex items-start gap-3">
          {toast.kind === "approved" ? (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          ) : (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Star className="h-4 w-4 fill-current" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {toast.kind === "new" && (
              <>
                <p className="text-sm font-semibold">
                  {toast.first ? "Your first testimonial just arrived" : `New testimonial from ${toast.latest.name}`}
                </p>
                {toast.latest.snippet && (
                  <p className="mt-1 line-clamp-3 text-sm italic text-muted-foreground">
                    &ldquo;{toast.latest.snippet}&rdquo;
                  </p>
                )}
                {toast.latest.rating ? (
                  <p className="mt-1 text-xs text-amber-500">{"★".repeat(toast.latest.rating)}</p>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" onClick={() => approve(toast.latest, toast.first, toast.wallUrl)} disabled={busy}>
                    {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/dashboard/inbox" onClick={() => setToast(null)}>
                      {toast.pending > 1 ? `Review all ${toast.pending}` : "Review"}
                    </Link>
                  </Button>
                </div>
              </>
            )}
            {toast.kind === "approved" && (
              <>
                <p className="text-sm font-semibold">
                  {toast.first ? "That's your first one on the wall" : `${toast.name} is on your wall`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">It is live on your Wall of Love and your widget now.</p>
                {toast.first && toast.wallUrl && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" asChild>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Our Wall of Love is live. Real words from real customers:")}&url=${encodeURIComponent(toast.wallUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("went_live_share_clicked", { channel: "x" })}
                      >
                        Share it on X
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={toast.wallUrl} target="_blank" rel="noopener noreferrer">
                        See your wall
                      </a>
                    </Button>
                  </div>
                )}
              </>
            )}
            {toast.kind === "error" && <p className="text-sm text-destructive">{toast.message}</p>}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
