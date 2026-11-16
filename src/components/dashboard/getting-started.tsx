import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Three-step "getting started" guide, the same on the welcome page and the
 * dashboard so a returning user sees where they left off:
 *   1. add a first testimonial,
 *   2. get to three (so the wall is not thin),
 *   3. put the wall on a site (the widget has been viewed).
 * Progress comes straight from the workspace's own numbers, so it needs no
 * stored state. Renders nothing once all three are done.
 *
 * variant "card": steps plus a button for the current one (dashboard).
 * variant "roadmap": the same steps as a slim, button-free strip, because the
 * welcome page already has its own big actions.
 */

export const GETTING_STARTED_STEPS = 3;

export function gettingStartedDone(testimonials: number, impressions: number): number {
  return [testimonials >= 1, testimonials >= 3, impressions > 0].filter(Boolean).length;
}

export function GettingStarted({
  testimonials,
  impressions,
  embedHref,
  variant = "card",
}: {
  testimonials: number;
  impressions: number;
  /** Where "put it on your site" should go; falls back to the widgets page. */
  embedHref?: string | null;
  variant?: "card" | "roadmap";
}) {
  const steps = [
    {
      label: "Add your first testimonial",
      done: testimonials >= 1,
      href: "/dashboard/import",
      cta: "Import a tweet",
    },
    {
      label: "Get to 3 testimonials",
      done: testimonials >= 3,
      href: "/dashboard/collect",
      cta: "Share your form",
    },
    {
      label: "Put your wall on your site",
      done: impressions > 0,
      href: embedHref || "/dashboard/widgets",
      cta: "Copy embed code",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const currentIdx = steps.findIndex((s) => !s.done);

  if (variant === "roadmap") {
    return (
      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-violet-200/70 bg-white/70 px-4 py-3 text-left shadow-sm backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
          Your 3 steps · {doneCount} of {steps.length} done
        </p>
        <ol className="mt-2 grid gap-2 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2 text-sm">
              <StepDot done={s.done} current={i === currentIdx} n={i + 1} />
              <span className={s.done ? "text-muted-foreground line-through" : i === currentIdx ? "font-semibold" : "text-muted-foreground"}>
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const current = steps[currentIdx];
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Getting started · {doneCount} of {steps.length} done
        </p>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-primary/15">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((doneCount / steps.length) * 100)}%` }} />
        </div>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3">
            <StepDot done={s.done} current={i === currentIdx} n={i + 1} />
            <span className={s.done ? "text-sm text-muted-foreground line-through" : i === currentIdx ? "text-sm font-semibold" : "text-sm text-muted-foreground"}>
              {s.label}
            </span>
            {i === currentIdx && (
              <Button asChild size="sm" className="ml-auto shrink-0">
                <Link href={current.href}>
                  {current.cta} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepDot({ done, current, n }: { done: boolean; current: boolean; n: number }) {
  if (done) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span
      className={
        current
          ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
          : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/40 text-[11px] text-muted-foreground"
      }
    >
      {n}
    </span>
  );
}
