import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracked-link";

interface LimitBannerProps {
  /** Short label of the thing at limit, e.g. "widget", "collection form", "testimonials" */
  resource: string;
  /** Human-friendly count/limit, e.g. "1 / 1" */
  usage: string;
  /** Optional extra sentence explaining what unlocks with Pro */
  description?: string;
}

/**
 * Compact banner shown when a Free workspace has hit a resource limit.
 * Used above the create button on widgets/collect pages, at the top of
 * the inbox when approvals are blocked, etc.
 */
export function LimitBanner({ resource, usage, description }: LimitBannerProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">
            You&apos;ve hit the Free plan {resource} limit ({usage})
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {description ??
              `Upgrade to Pro for unlimited ${resource}s and premium features.`}
          </p>
        </div>
      </div>
      <Button asChild size="sm">
        <TrackedLink
          cta="limit_banner_go_pro"
          surface="limit_banner"
          href="/dashboard/settings/billing"
        >
          Go Pro
        </TrackedLink>
      </Button>
    </div>
  );
}
