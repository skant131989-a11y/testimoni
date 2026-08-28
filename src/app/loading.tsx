/**
 * Suspense fallback for the landing page and other root routes.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b" />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 px-4 py-20">
        <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-14 w-full max-w-2xl animate-pulse rounded-lg bg-muted" />
        <div className="h-14 w-3/4 max-w-xl animate-pulse rounded-lg bg-muted" />
        <div className="mt-4 h-12 w-64 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
