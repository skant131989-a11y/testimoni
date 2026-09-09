"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  Trash2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { track } from "@/lib/analytics";

type Platform =
  | "APP_STORE"
  | "GOOGLE_PLAY"
  | "PRODUCT_HUNT"
  | "CHROME_STORE"
  | "SHOPIFY"
  | "TRUSTPILOT";

type SyncStatus = "ACTIVE" | "ERROR" | "DISABLED";

interface Source {
  id: string;
  platform: Platform;
  displayName: string;
  sourceUrl: string;
  minRating: number;
  autoApprove: boolean;
  lastSyncedAt: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  totalImported: number;
  createdAt: string;
}

interface Props {
  initialSources: Source[];
  isPro: boolean;
  platforms: { platform: Platform; available: boolean }[];
}

const PLATFORM_META: Record<Platform, { label: string; hint: string }> = {
  APP_STORE: {
    label: "Apple App Store",
    hint: "Paste an https://apps.apple.com/... URL",
  },
  GOOGLE_PLAY: {
    label: "Google Play Store",
    hint: "Paste a play.google.com/store/apps/details?id=... URL",
  },
  PRODUCT_HUNT: {
    label: "Product Hunt",
    hint: "Paste your product URL (producthunt.com/products/...)",
  },
  CHROME_STORE: {
    label: "Chrome Web Store",
    hint: "Paste your extension URL (chromewebstore.google.com/detail/...)",
  },
  SHOPIFY: { label: "Shopify App Store", hint: "" },
  TRUSTPILOT: { label: "Trustpilot", hint: "" },
};

export function ReviewSourcesClient({ initialSources, isPro, platforms }: Props) {
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [url, setUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  // Sync-completion banner state — cleared when the user dismisses
  // or fires another sync. Autoclears after 12s so it doesn't
  // linger forever. We track wentToWall separately from imported
  // so the copy can say "landed on your wall" vs "in Pending" —
  // depending on the source's autoApprove setting.
  const [syncNotice, setSyncNotice] = useState<{
    sourceName: string;
    imported: number;
    wentToWall: boolean;
  } | null>(null);

  const availablePlatformCount = platforms.filter((p) => p.available).length;

  async function handleConnect() {
    if (!url.trim()) return;
    setError(null);
    setConnecting(true);
    track("review_source_connect_started");
    try {
      const res = await fetch("/api/review-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setError(data.error || "Pro plan required.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Couldn't connect that source.");
        return;
      }
      setSources((prev) => [data.source, ...prev]);
      setUrl("");
      track("review_source_connected", { platform: data.source.platform });
      // Trigger initial sync in background.
      handleSync(data.source.id);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    setError(null);
    setSyncNotice(null);
    const source = sources.find((s) => s.id === id);
    try {
      const res = await fetch(`/api/review-sources/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sync failed.");
        return;
      }
      // Refetch the full state — sync updates syncStatus + counters.
      const listRes = await fetch("/api/review-sources");
      const listData = await listRes.json();
      if (listData.sources) setSources(listData.sources);
      track("review_source_synced", {
        source_id: id,
        imported: data.result?.imported ?? 0,
      });
      const imported = data.result?.imported ?? 0;
      if (imported > 0) {
        setSyncNotice({
          sourceName: source?.displayName ?? "Source",
          imported,
          wentToWall: source?.autoApprove ?? false,
        });
        // Auto-clear so a stale banner doesn't outlive the user's
        // attention. 12s is long enough to click the link if they
        // want to jump to the target queue.
        setTimeout(() => setSyncNotice(null), 12_000);
        router.refresh();
      } else if (data.result?.skipped > 0) {
        setSyncNotice({
          sourceName: source?.displayName ?? "Source",
          imported: 0,
          wentToWall: false,
        });
        setTimeout(() => setSyncNotice(null), 6_000);
      }
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Disconnect this source? Testimonials already imported will stay on your wall.")) return;
    const res = await fetch(`/api/review-sources/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSources((prev) => prev.filter((s) => s.id !== id));
      track("review_source_disconnected", { source_id: id });
    }
  }

  /**
   * Optimistically flip autoApprove and PATCH the server. On failure
   * we roll the state back so the toggle reflects reality.
   */
  async function handleToggleAutoApprove(id: string, next: boolean) {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, autoApprove: next } : s)),
    );
    track("review_source_auto_approve_toggled", {
      source_id: id,
      value: next,
    });
    try {
      const res = await fetch(`/api/review-sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoApprove: next }),
      });
      if (!res.ok) throw new Error("PATCH failed");
    } catch {
      // Roll back the optimistic toggle if the server rejected it.
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, autoApprove: !next } : s)),
      );
    }
  }

  /**
   * Change the rating threshold on a source. Reviews below the new
   * threshold on the NEXT sync will be skipped; already-imported
   * testimonials are unaffected (users can archive those manually).
   * Optimistic update with rollback on server failure.
   */
  async function handleChangeMinRating(id: string, next: number) {
    const prev = sources.find((s) => s.id === id)?.minRating;
    setSources((current) =>
      current.map((s) => (s.id === id ? { ...s, minRating: next } : s)),
    );
    track("review_source_min_rating_changed", {
      source_id: id,
      from: prev,
      to: next,
    });
    try {
      const res = await fetch(`/api/review-sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minRating: next }),
      });
      if (!res.ok) throw new Error("PATCH failed");
    } catch {
      if (prev !== undefined) {
        setSources((current) =>
          current.map((s) => (s.id === id ? { ...s, minRating: prev } : s)),
        );
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> Pro feature
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Review sources</h1>
        <p className="mt-1 text-muted-foreground">
          Auto-sync reviews from App Store, Play Store, Product Hunt, and
          Chrome Web Store to your Wall of Love.
        </p>
      </div>

      {/* Sync-completion banner — appears immediately after a
          successful sync so the user knows WHERE the imported
          reviews landed. Kills the "where did they go?" confusion
          the first time. Autoclears after 12s (6s for the 0-imports
          case). Clickable link jumps straight to the target queue. */}
      {syncNotice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border-2 border-emerald-300/60 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-4 w-4" />
            </div>
            <div>
              {syncNotice.imported > 0 ? (
                <>
                  <p className="text-sm font-semibold text-emerald-900">
                    {syncNotice.imported} new review
                    {syncNotice.imported === 1 ? "" : "s"} imported from{" "}
                    {syncNotice.sourceName}
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-800">
                    {syncNotice.wentToWall ? (
                      <>
                        Auto-approve is on — they&apos;re already live on your{" "}
                        <Link
                          href="/dashboard"
                          className="font-semibold underline underline-offset-2 hover:text-emerald-950"
                        >
                          Wall of Love
                        </Link>
                        .
                      </>
                    ) : (
                      <>
                        They&apos;re waiting for approval in{" "}
                        <Link
                          href="/dashboard/testimonials?filter=pending"
                          className="font-semibold underline underline-offset-2 hover:text-emerald-950"
                        >
                          Testimonials → Pending
                        </Link>
                        .
                      </>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-emerald-900">
                  {syncNotice.sourceName} is up to date — no new reviews found.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="shrink-0 rounded-full p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Pro paywall */}
      {!isPro && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold">
                Every review, every platform, one wall.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect the platforms where your customers already leave
                reviews. Testimoni pulls new ones automatically — you approve,
                they land on your wall. Pro plan only.
              </p>
            </div>
            <Link href="/pricing">
              <Button size="lg" className="gap-2">
                Upgrade to Pro <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Connect a source */}
      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle>Connect a new source</CardTitle>
            <CardDescription>
              Paste a URL. We auto-detect which platform it&apos;s from and
              pull the latest reviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://apps.apple.com/... · play.google.com/... · chromewebstore.google.com/..."
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                className="font-mono text-xs sm:text-sm"
              />
              <Button
                onClick={handleConnect}
                disabled={connecting || !url.trim()}
                className="shrink-0 gap-2"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Connecting
                  </>
                ) : (
                  <>
                    Connect & sync <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span>Supported ({availablePlatformCount}):</span>
              {platforms
                .filter((p) => p.available)
                .map((p) => (
                  <span key={p.platform} className="font-medium">
                    {PLATFORM_META[p.platform].label}
                  </span>
                ))}
              {platforms.some((p) => !p.available) && (
                <span className="italic">
                  · Coming soon:{" "}
                  {platforms
                    .filter((p) => !p.available)
                    .map((p) => PLATFORM_META[p.platform].label)
                    .join(", ")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected sources list */}
      {sources.length === 0 ? (
        isPro && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No sources connected yet. Paste a review URL above to get started.
            </CardContent>
          </Card>
        )
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-semibold">
                      {s.displayName}
                    </p>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {PLATFORM_META[s.platform].label}
                    </span>
                    {s.syncStatus === "ERROR" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                        <AlertCircle className="h-3 w-3" /> Error
                      </span>
                    )}
                    {s.syncStatus === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {s.sourceUrl}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.totalImported} imported ·{" "}
                    {s.lastSyncedAt
                      ? `Last synced ${new Date(s.lastSyncedAt).toLocaleString()}`
                      : "Never synced"}
                  </p>
                  {s.syncError && (
                    <p className="mt-1 text-xs text-destructive">
                      {s.syncError}
                    </p>
                  )}

                  {/* Rating threshold dropdown — editable anytime.
                      Changes take effect on the NEXT sync; testimonials
                      already imported at the old threshold stay put.
                      Reasonable defaults: 4★+ hides ranty reviews
                      without being too restrictive. 5★ is the "only
                      the raves" option. 1★+ is "everything." */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <label
                      htmlFor={`min-rating-${s.id}`}
                      className="font-medium"
                    >
                      Minimum rating to import:
                    </label>
                    <select
                      id={`min-rating-${s.id}`}
                      value={s.minRating}
                      onChange={(e) =>
                        handleChangeMinRating(s.id, Number(e.target.value))
                      }
                      disabled={!isPro}
                      className="rounded-md border bg-background px-2 py-1 text-xs font-semibold focus:border-primary focus:outline-none disabled:opacity-60"
                    >
                      <option value={1}>1★+ (everything)</option>
                      <option value={2}>2★+</option>
                      <option value={3}>3★+</option>
                      <option value={4}>4★+ (recommended)</option>
                      <option value={5}>5★ only (raves)</option>
                    </select>
                    <span className="text-muted-foreground">
                      Change anytime — applies to future syncs.
                    </span>
                  </div>

                  {/* Auto-approve toggle */}
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={s.autoApprove}
                      onChange={(e) =>
                        handleToggleAutoApprove(s.id, e.target.checked)
                      }
                      disabled={!isPro}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    <span className="font-medium">
                      Auto-approve future reviews
                    </span>
                    <span className="text-muted-foreground">
                      — land straight on your Wall of Love. Off = review
                      in Testimonials → Pending.
                    </span>
                  </label>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(s.id)}
                    disabled={syncingId === s.id || !isPro}
                  >
                    {syncingId === s.id ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Syncing
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Sync now
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Open
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(s.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
