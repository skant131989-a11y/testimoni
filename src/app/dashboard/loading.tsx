/**
 * Generic dashboard loading state — shown during navigation between
 * dashboard pages while the target route's server components stream.
 * Without this file, clicks felt broken: no visual response for
 * 1-3s until the new page fully rendered.
 *
 * Copy is neutral (not "Setting up your Wall of Love") because this
 * fires on EVERY dashboard navigation, not just first-time signup.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Heading placeholder */}
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-muted/60" />
      </div>

      {/* Card row placeholder */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border bg-card"
          />
        ))}
      </div>

      {/* List placeholder */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
