"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { MILESTONE_COUNTS } from "@/lib/milestones";

interface MilestoneNudgeProps {
  approvedCount: number;
  widgetId: string;
  wallUrl: string;
}

/**
 * Celebrate testimonial milestones on the dashboard and nudge sharing.
 * Fires at 1, 5, 10, 25, 50, 100 approved testimonials. Dismissible
 * per-session (sessionStorage) so users don't see the same milestone
 * banner every dashboard visit — but they'll see the next one when
 * they cross it.
 *
 * Sharing is our growth loop, so hitting a milestone is exactly the
 * moment to remind the user their wall is worth showing off.
 */
/**
 * Milestone counts at which the nudge fires. Re-exported here for
 * anyone importing MILESTONE_COUNTS from the component file; the
 * canonical source lives in @/lib/milestones so server components
 * can import it safely.
 */
function pickMilestone(count: number): number | null {
  // Show only when the current count matches a milestone exactly —
  // just landing on the number is when celebration makes sense. As
  // soon as they cross to N+1 the banner disappears.
  return MILESTONE_COUNTS.includes(count) ? count : null;
}

function copyFor(count: number): { headline: string; body: string } {
  if (count === 1) {
    return {
      headline: "You have your first testimonial!",
      body: "This is the whole reason your wall exists. Drop the URL in your bio or share it in a DM.",
    };
  }
  if (count === 5) {
    return {
      headline: "5 testimonials and counting.",
      body: "Your wall is starting to sing. Time to add the URL to your Instagram bio, email signature, or a QR code on your packaging.",
    };
  }
  if (count === 10) {
    return {
      headline: "10 approved testimonials.",
      body: "You've hit critical mass — embed the wall on your homepage and start converting visitors into customers.",
    };
  }
  if (count === 25) {
    return {
      headline: "25 testimonials strong.",
      body: "Real social proof. Time to make it front and center on your marketing site.",
    };
  }
  if (count === 50) {
    return {
      headline: "50 testimonials. Serious social proof.",
      body: "You're in the top 5% of Testimoni users. Your wall deserves a spot on your homepage and every landing page.",
    };
  }
  return {
    headline: `${count} testimonials — that's rare air.`,
    body: "Time to make sure every visitor and every customer sees your Wall of Love.",
  };
}

export function MilestoneNudge({ approvedCount, widgetId, wallUrl }: MilestoneNudgeProps) {
  const milestone = pickMilestone(approvedCount);

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined" || milestone == null) return false;
    try {
      return sessionStorage.getItem(`milestone_dismissed_${milestone}`) === "1";
    } catch {
      return false;
    }
  });

  if (milestone == null || dismissed) return null;

  const { headline, body } = copyFor(milestone);

  function dismiss() {
    try {
      sessionStorage.setItem(`milestone_dismissed_${milestone}`, "1");
    } catch {}
    setDismissed(true);
    track("milestone_nudge_dismissed", { milestone });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Milestone · {milestone} approved
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {headline}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a
                href={wallUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("wall_view_clicked", {
                    surface: "milestone_nudge",
                    milestone,
                  })
                }
              >
                View my wall <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/dashboard/widgets/${widgetId}/embed`}
                onClick={() =>
                  track("wall_embed_clicked", {
                    surface: "milestone_nudge",
                    milestone,
                  })
                }
              >
                Get the embed code
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
