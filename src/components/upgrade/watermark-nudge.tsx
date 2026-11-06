"use client";

import { useSubscription } from "@/lib/use-subscription";
import { UpgradeNudge } from "@/components/upgrade/upgrade-nudge";

/**
 * Free walls carry a small "Powered by Testimoni" badge. Anyone who
 * has set up a widget or an embed is about to show it to customers,
 * which is the moment removing it is worth the most.
 * Renders nothing for Pro, and nothing until the plan is known (so Pro
 * users never see a flash of it).
 */
export function WatermarkNudge({ where }: { where: string }) {
  const { plan, loading } = useSubscription();
  if (loading || plan !== "FREE") return null;

  return (
    <UpgradeNudge
      surface={`watermark_${where}`}
      title="Your wall shows a “Powered by Testimoni” badge"
      points={[
        "Pro removes it and lets you use your own colors and branding",
        "Plus all five layouts and unlimited widgets",
      ]}
    >
      Visitors see it under every testimonial on your site.
    </UpgradeNudge>
  );
}
