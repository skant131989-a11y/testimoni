"use client";

import { useState } from "react";
import { Loader2, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";

/**
 * Batch-paste flow for the praise tweet finder.
 *
 * The core insight: users open X/Twitter, find 3-8 good tweets,
 * come back to Testimoni. If we only accept ONE URL at a time,
 * they have to trip back and forth. Let them paste all URLs at
 * once — comma-separated OR one per line — then each becomes a
 * card with a preview + Add button.
 *
 * Anonymous visitors: each card links to /signup?import=<url>.
 * Logged-in visitors: each card has an Add-to-my-Wall button that
 * POSTs to /api/testimonials/import-url and lands the tweet
 * instantly. Add-all button on top for one-click bulk.
 */

const TWEET_URL_RE =
  /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/\d+/gi;
const LINKEDIN_URL_RE =
  /https?:\/\/(?:www\.)?linkedin\.com\/(?:feed\/update|posts|pulse)[^\s,]+/gi;

interface Row {
  url: string;
  status: "idle" | "saving" | "saved" | "error";
  error?: string;
}

interface Props {
  isLoggedIn: boolean;
}

export function BatchImportPanel({ isLoggedIn }: Props) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  function parse() {
    const found = new Set<string>();
    for (const m of text.matchAll(TWEET_URL_RE)) found.add(m[0]);
    for (const m of text.matchAll(LINKEDIN_URL_RE)) found.add(m[0]);
    // If they pasted "one per line" or "comma-separated" without
    // any regex hit, fall back to splitting the raw input.
    if (found.size === 0) {
      for (const chunk of text.split(/[\s,]+/)) {
        const u = chunk.trim();
        if (u.startsWith("http")) found.add(u);
      }
    }
    const list = [...found].map((u) => ({ url: u, status: "idle" as const }));
    setRows(list);
    track("praise_batch_parsed", { count: list.length });
  }

  async function saveOne(idx: number) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, status: "saving" } : r))
    );
    try {
      const res = await fetch("/api/testimonials/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rows[idx].url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRows((prev) =>
          prev.map((r, i) =>
            i === idx
              ? { ...r, status: "error", error: data.error || "Failed" }
              : r
          )
        );
        return;
      }
      setRows((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, status: "saved" } : r))
      );
      track("praise_batch_row_saved");
    } catch {
      setRows((prev) =>
        prev.map((r, i) =>
          i === idx
            ? { ...r, status: "error", error: "Network error" }
            : r
        )
      );
    }
  }

  async function saveAll() {
    if (bulkSaving) return;
    setBulkSaving(true);
    // Serial so we don't hammer the import endpoint with parallel
    // requests. 10 URLs × ~2s = 20s worst case — a small progress
    // pop is enough.
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === "saved") continue;
      await saveOne(i);
    }
    setBulkSaving(false);
    track("praise_batch_save_all", { count: rows.length });
  }

  if (!isLoggedIn) {
    // Anonymous — keep the panel visible but link each row to
    // signup with the URL prefilled. We COULD auto-import after
    // signup via sessionStorage, but for batch we'd need to stash
    // an array, and the current single-URL sessionStorage bridge
    // isn't multi-aware. First shipping the primary logged-in
    // path; anonymous batch UX can follow.
    return (
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm font-semibold">
          Or paste multiple URLs at once
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign up to unlock batch import — paste 3-10 tweet URLs and
          save them all in one shot.
        </p>
        <Button asChild size="sm" className="mt-3">
          <a href="/signup?tool=praise-tweet-finder">
            Sign up to batch import <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm font-semibold">
        Or paste multiple URLs — save them all at once
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        One URL per line, or comma-separated. X / Twitter and
        LinkedIn are supported.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="https://x.com/user/status/123&#10;https://x.com/user/status/456&#10;https://x.com/user/status/789"
        rows={4}
        className="mt-3 font-mono text-xs"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={parse}
          disabled={!text.trim()}
        >
          Parse URLs
        </Button>
        {rows.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={saveAll}
            disabled={bulkSaving || rows.every((r) => r.status === "saved")}
            className="gap-1.5"
          >
            {bulkSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                Add all to my Wall ({rows.filter((r) => r.status !== "saved").length})
              </>
            )}
          </Button>
        )}
      </div>

      {rows.length > 0 && (
        <ul className="mt-4 space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.url}
              className="flex flex-col gap-2 rounded-md border bg-muted/20 px-3 py-2 sm:flex-row sm:items-center"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate font-mono text-[11px] text-primary hover:underline"
              >
                {r.url}
              </a>
              {r.status === "saved" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              {r.status === "error" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive" title={r.error}>
                  <X className="h-3.5 w-3.5" /> {r.error?.slice(0, 40) || "Failed"}
                </span>
              )}
              {(r.status === "idle" || r.status === "saving") && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => saveOne(i)}
                  disabled={r.status === "saving" || bulkSaving}
                  className="gap-1"
                >
                  {r.status === "saving" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Adding…
                    </>
                  ) : (
                    <>Add to Wall</>
                  )}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
