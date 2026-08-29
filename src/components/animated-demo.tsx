import { Star, ArrowRight, Send } from "lucide-react";
import Link from "next/link";

/**
 * Auto-playing animated hero showing the collect → display flow.
 * CSS keyframes only — no JS, no video, no GIF. Loops every 12s.
 *
 * The animation:
 *   0-3s   : "typing" the customer's name + testimonial
 *   3-4s   : stars fill in
 *   4-5s   : submit button pulses and "clicks"
 *   5-8s   : new card slides into the widget on the right
 *   8-12s  : pause showing the final state
 *   loop.
 */
export function AnimatedDemo() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <style>{`
        @keyframes ad-type-name {
          0%, 5% { width: 0; }
          20%, 100% { width: 6.5rem; }
        }
        @keyframes ad-type-content {
          0%, 20% { width: 0; }
          40%, 100% { width: 100%; }
        }
        @keyframes ad-star-fill {
          0%, 100% { fill: #facc15; transform: scale(1); }
          42% { fill: #facc15; transform: scale(1.35); }
          50% { fill: #facc15; transform: scale(1); }
        }
        @keyframes ad-submit-pulse {
          0%, 60% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
          65% { transform: scale(0.96); box-shadow: 0 0 0 8px rgba(124, 58, 237, 0); }
          70%, 100% { transform: scale(1); }
        }
        @keyframes ad-slide-in {
          0%, 65% { opacity: 0; transform: translateX(24px); }
          75%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes ad-highlight {
          0%, 65% { box-shadow: none; }
          75% { box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.4); }
          95%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
        }
        @keyframes ad-arrow-flow {
          0%, 60% { transform: translateX(0); opacity: 0.4; }
          70% { transform: translateX(6px); opacity: 1; }
          80%, 100% { transform: translateX(0); opacity: 0.4; }
        }
        @keyframes ad-badge-pop {
          0%, 65% { transform: scale(0); }
          75% { transform: scale(1.2); }
          80%, 100% { transform: scale(1); }
        }
        .ad-loop { animation-duration: 12s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        .ad-type-name    { animation-name: ad-type-name; }
        .ad-type-content { animation-name: ad-type-content; }
        .ad-star         { animation-name: ad-star-fill; }
        .ad-submit       { animation-name: ad-submit-pulse; }
        .ad-slide        { animation-name: ad-slide-in; }
        .ad-highlight    { animation-name: ad-highlight; }
        .ad-arrow        { animation-name: ad-arrow-flow; }
        .ad-badge        { animation-name: ad-badge-pop; transform-origin: center; }
      `}</style>

      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Live product preview
        </div>
        <Link
          href="/demo"
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
        >
          Try it yourself
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-4 rounded-2xl border bg-card p-4 shadow-lg lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6 lg:p-6">
        {/* LEFT: Form */}
        <div className="rounded-xl border-2 border-primary/20 bg-background p-5">
          <div className="mb-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Customer view
            </p>
            <h3 className="mt-1 text-base font-bold">Share your experience</h3>
          </div>

          <div className="space-y-3">
            {/* Stars */}
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Rating
              </p>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className="ad-loop ad-star h-5 w-5 fill-yellow-400"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      color: "#facc15",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Content field with "typing" cursor */}
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Testimonial
              </p>
              <div className="min-h-[3.5rem] rounded-md border bg-white p-2 text-xs leading-relaxed text-foreground">
                <span
                  className="ad-loop ad-type-content inline-block overflow-hidden whitespace-nowrap align-bottom"
                  style={{ width: 0 }}
                >
                  Setup took 5 minutes. Widget looks great on our homepage.
                </span>
              </div>
            </div>

            {/* Name field */}
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Your name
              </p>
              <div className="rounded-md border bg-white px-2 py-1.5 text-xs text-foreground">
                <span
                  className="ad-loop ad-type-name inline-block overflow-hidden whitespace-nowrap align-bottom"
                  style={{ width: 0 }}
                >
                  Sarah Chen
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="button"
              className="ad-loop ad-submit inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
              disabled
              tabIndex={-1}
            >
              <Send className="h-3 w-3" />
              Submit
            </button>
          </div>
        </div>

        {/* MIDDLE: Two-step flow — hidden on mobile */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="ad-loop ad-arrow flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              1 · Approve
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="ad-loop ad-arrow flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              2 · Add to widget
            </p>
          </div>
        </div>

        {/* RIGHT: Widget preview */}
        <div className="rounded-xl bg-muted/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Widget on your site
            </p>
            <span className="ad-loop ad-badge inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              +1 new
            </span>
          </div>

          <div className="space-y-2">
            {/* The new card that slides in — highlighted */}
            <div
              className="ad-loop ad-slide ad-highlight rounded-lg border bg-background p-3"
              style={{ opacity: 0 }}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed">
                &ldquo;Setup took 5 minutes. Widget looks great on our homepage.&rdquo;
              </p>
              <p className="mt-1.5 text-xs font-semibold">— Sarah Chen</p>
            </div>

            {/* Static existing cards */}
            {[
              {
                name: "Marcus Johnson",
                content: "My students love leaving quick video reviews here.",
              },
              {
                name: "Emily Rodriguez",
                content: "Switched from a manual page to Testimoni. Huge time saver.",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-lg border bg-background p-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                <p className="mt-1.5 text-xs font-semibold">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        This whole flow — form, approve, curate, embed — is what{" "}
        <Link href="/demo" className="font-semibold text-primary hover:underline">
          the live demo
        </Link>{" "}
        lets you play with hands-on.
      </p>
    </div>
  );
}
