/**
 * Dashboard skeleton — mirrors the real /dashboard layout (NBA banner,
 * stats grid, wall card, recent testimonials list, "Do next" surface)
 * so the swap to real content is imperceptible.
 *
 * Two-layer motion:
 * - Tailwind's `animate-pulse` (built-in opacity 0.5 -> 1) does the
 *   ambient breathing.
 * - Custom `.fw-shimmer` sweeps a translucent white gradient across
 *   each block every ~1.6s. Combined they read as "working" without
 *   feeling like a broken layout.
 *
 * Fires instantly the moment a user clicks a link into /dashboard.
 * No DB call, no client JS beyond Tailwind — the skeleton is server-
 * rendered by Next's loading.tsx convention.
 */

function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`fw-shimmer relative overflow-hidden rounded-md bg-muted ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <style>{`
        @keyframes fw-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .fw-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.55) 50%,
            transparent 100%
          );
          animation: fw-shimmer 1.6s infinite;
        }
      `}</style>

      {/* Page heading */}
      <div className="animate-pulse space-y-3">
        <Block className="h-8 w-56" />
        <Block className="h-4 w-80 bg-muted/60" />
      </div>

      {/* Do-next / NBA banner */}
      <div className="animate-pulse rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-start gap-3">
            <Block className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Block className="h-3 w-24" />
              <Block className="h-5 w-3/5" />
              <Block className="h-4 w-4/5 bg-muted/60" />
            </div>
          </div>
          <Block className="hidden h-11 w-32 rounded-md sm:block" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse space-y-3 rounded-xl border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <Block className="h-4 w-24" />
              <Block className="h-4 w-4 rounded" />
            </div>
            <Block className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Wall URL card */}
      <div className="animate-pulse rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-2">
            <Block className="h-4 w-40" />
            <Block className="h-5 w-72 max-w-full bg-muted/60" />
          </div>
          <div className="flex gap-2">
            <Block className="h-9 w-24 rounded-md" />
            <Block className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Recent testimonials list */}
      <div className="space-y-3">
        <Block className="h-5 w-48" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <Block className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Block className="h-4 w-32" />
                <Block className="h-3 w-full bg-muted/60" />
                <Block className="h-3 w-11/12 bg-muted/60" />
              </div>
              <Block className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
