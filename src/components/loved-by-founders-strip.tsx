import { pickDailyPraise } from "@/lib/home-praise";

/**
 * "Loved by founders" strip — one hand-curated real testimonial with
 * a link to the source tweet + a link to see the full wall. Same
 * component renders on the home, /pricing, /features, /demo, and any
 * marketing page that needs a low-friction social-proof injection.
 *
 * Uses pickDailyPraise() — deterministic per UTC day, so refreshes
 * are stable AND multiple instances on the same page show the same
 * quote (no cognitive dissonance from seeing two different "loved
 * by founders" pull-quotes on the same URL).
 *
 * Two clickable regions instead of one nested <a> (invalid HTML):
 *   - Left (pill + quote + author) opens the source tweet
 *   - Right ("See all praise →") opens the Wall of Love
 *
 * Server component — zero client bundle.
 */
export function LovedByFoundersStrip() {
  const praise = pickDailyPraise();
  return (
    <section className="border-b bg-muted/20 py-6">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm sm:flex-row">
          <a
            href={praise.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-1 flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
          >
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              Loved by founders
            </span>
            <blockquote className="min-w-0 flex-1 text-sm italic text-foreground line-clamp-3 sm:text-base sm:line-clamp-2">
              &ldquo;{praise.content}&rdquo;
            </blockquote>
            <span className="shrink-0 text-xs text-muted-foreground">
              — {praise.customerName}
            </span>
          </a>
          <a
            href={praise.wallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex shrink-0 items-center justify-center gap-1.5 border-t border-border bg-primary/5 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 sm:border-l sm:border-t-0 sm:py-4"
          >
            See all praise
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
