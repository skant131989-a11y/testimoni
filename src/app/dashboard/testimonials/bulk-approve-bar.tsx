"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/**
 * Bulk-approve bar for the Testimonials → Pending tab.
 *
 * Shown when there are >=2 pending testimonials. Small button;
 * on click opens a compact confirm sheet with a rating filter
 * dropdown ("All", "4-star and up", "5-star only") + the actual
 * counts. One click on Approve sends them all to the wall.
 *
 * Not rendered on other tabs — approving from "All" would be
 * ambiguous (which subset?) and Archived / Approved don't need it.
 */

interface Props {
  totalPending: number;
  /** Per-rating counts for the dropdown labels. Server-computed. */
  counts: {
    fiveStar: number;
    fourStarPlus: number;
    threeStarPlus: number;
  };
}

type Filter = "all" | "4plus" | "5only" | "3plus";

const FILTER_OPTIONS: Record<Filter, { label: string; minRating: number }> = {
  all: { label: "All ratings", minRating: 0 },
  "3plus": { label: "3-star and up", minRating: 3 },
  "4plus": { label: "4-star and up", minRating: 4 },
  "5only": { label: "5-star only", minRating: 5 },
};

export function BulkApproveBar({ totalPending, counts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("4plus");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (totalPending < 2) return null;

  const countByFilter: Record<Filter, number> = {
    all: totalPending,
    "3plus": counts.threeStarPlus,
    "4plus": counts.fourStarPlus,
    "5only": counts.fiveStar,
  };
  const targetCount = countByFilter[filter];

  async function handleApproveAll() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/testimonials/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minRating: FILTER_OPTIONS[filter].minRating }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bulk approve failed.");
        return;
      }
      track("bulk_approve_success", {
        approved: data.approved,
        filter,
      });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between rounded-xl border-2 border-primary/25 bg-primary/[0.04] p-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <p className="text-sm">
            <span className="font-semibold">{totalPending} pending</span>{" "}
            <span className="text-muted-foreground">
              — approve them all in one click.
            </span>
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approve all → Wall
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/40 bg-primary/[0.04] p-4">
      <p className="text-sm font-semibold">
        Approve pending testimonials in bulk
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        They&apos;ll flip to APPROVED and land at the end of your Wall of Love.
        Approved rows can still be archived one at a time later.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-muted-foreground">
          Filter:
        </label>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            disabled={busy}
            className="appearance-none rounded-md border bg-background px-3 py-1.5 pr-8 text-sm font-medium focus:border-primary focus:outline-none"
          >
            {(Object.keys(FILTER_OPTIONS) as Filter[]).map((k) => (
              <option key={k} value={k}>
                {FILTER_OPTIONS[k].label} ({countByFilter[k]})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApproveAll}
            disabled={busy || targetCount === 0}
            className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
          >
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Approving {targetCount}…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve {targetCount} → Wall
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
