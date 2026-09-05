"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracked-link";

/**
 * Shared signup upsell block used at the bottom of every /tools/* page.
 *
 * Was previously copy-pasted (~15 lines) in each of the six tool
 * clients — Card, Praise Finder, Writer, Ask Templates, LinkedIn Rec,
 * Star Badge. Extracted so:
 *   1. Copy tweaks live in one file, not six
 *   2. Analytics fires consistently (via TrackedLink) with a
 *      tool-specific cta slug so we can see which tool converts best
 *   3. Future A/B tests on the upsell change once, everywhere updates
 *
 * The optional `badge` prop adds an eyebrow above the headline —
 * useful when a specific unlock is at stake (e.g., "Free signup unlocks"
 * or "Signed up? Get it live.").
 */
interface Props {
  /** Short slug for analytics — becomes cta="{tool}_bottom_signup". */
  tool: string;
  headline: string;
  description: React.ReactNode;
  /** Optional eyebrow badge above the headline. */
  badge?: string;
  /** Optional signup query params (e.g., "unlock=watermark"). */
  intent?: string;
  ctaLabel?: string;
}

export function ToolSignupUpsell({
  tool,
  headline,
  description,
  badge,
  intent,
  ctaLabel = "Start free",
}: Props) {
  const href = intent
    ? `/signup?tool=${tool}&intent=${intent}`
    : `/signup?tool=${tool}`;

  return (
    <div className="mt-16 rounded-2xl border-2 border-primary/30 bg-primary/5 p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          {badge && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> {badge}
            </div>
          )}
          <h2 className="text-2xl font-bold">{headline}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        <TrackedLink
          cta={`${tool}_bottom_signup`}
          surface={`tools_${tool}`}
          href={href}
        >
          <Button size="lg" className="gap-2">
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </Button>
        </TrackedLink>
      </div>
    </div>
  );
}
