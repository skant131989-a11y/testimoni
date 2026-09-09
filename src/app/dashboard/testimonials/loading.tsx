import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Loading skeleton for /dashboard/testimonials — Next.js shows this
 * automatically during navigations to this route, including tab
 * switches between All / Pending / Approved / Archived (all four
 * hit the same route with a different ?filter=… param).
 *
 * The tab bar switches were previously silent — user clicked "Pending",
 * saw nothing happen for 1-3 seconds while the server re-ran counts +
 * findMany, then the new rows appeared. This gives them the same
 * kind of shimmer the dashboard's Recent Testimonials card has.
 *
 * Structure mirrors the real page:
 *   - Heading (real, not skeleton — persists across nav)
 *   - Search bar
 *   - 4-tab strip with pulse
 *   - N stacked row skeletons
 */
export default function TestimonialsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
        <p className="text-muted-foreground">
          Manage and organize your customer testimonials.
        </p>
      </div>

      <div className="space-y-4">
        {/* Search input placeholder */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <div className="h-10 w-full animate-pulse rounded-md border bg-muted/40" />
        </div>

        {/* Tab bar with spinner (matches the real layout so nothing
            visually jumps when the real content lands) */}
        <div className="flex items-center gap-1 border-b">
          {["All", "Pending", "Approved", "Archived"].map((label, i) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium",
                i === 0
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground",
              )}
            >
              {label}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              </span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2 pr-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading…
          </div>
        </div>

        {/* Row skeletons */}
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted/70" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted/70" />
                  </div>
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
