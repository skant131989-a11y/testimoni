import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Loading skeleton for /dashboard/inbox — shown by Next.js while
 * the server re-runs the submission query on tab switches or
 * browser back/forward. Client-side tab switches ALSO show the
 * top progress bar from TabsWithProgress; this covers the
 * non-transition navigations.
 */
export default function InboxLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
        <p className="text-muted-foreground">
          Review submissions from your collection forms. Approve to add them to your testimonials.
        </p>
      </div>

      {/* Placeholder tab strip matching the real layout */}
      <div className="flex items-center gap-1 border-b">
        {["New", "Approved", "Rejected"].map((label, i) => (
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

      {/* Row skeletons matching submission cards */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
