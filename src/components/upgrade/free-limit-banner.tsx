"use client";

import { UpgradeNudge } from "@/components/upgrade/upgrade-nudge";

/**
 * Dashboard banner for Free accounts that are close to, or at, the
 * 10-testimonial limit. Positive framing: they've done the hard part.
 * Nothing is removed or hidden at the limit; they just can't add more.
 */
export function FreeLimitBanner({ count, max }: { count: number; max: number }) {
  if (!isFinite(max) || count < Math.ceil(max * 0.7)) return null;

  const atLimit = count >= max;
  const left = max - count;

  return (
    <UpgradeNudge
      surface={atLimit ? "free_limit_reached" : "free_limit_near"}
      title={
        atLimit
          ? `You've collected ${count} testimonials. That's the free limit.`
          : `You're ${left} testimonial${left === 1 ? "" : "s"} away from the free limit`
      }
      points={[
        "Unlimited testimonials, widgets and forms",
        "Remove the “Powered by Testimoni” badge",
        "30 deeper praise scans a month and a weekly re-scan",
      ]}
    >
      {atLimit
        ? "Everything you've added stays on your wall. Pro lets you keep adding."
        : "Upgrade before you hit it, so new praise never has to wait."}
    </UpgradeNudge>
  );
}
