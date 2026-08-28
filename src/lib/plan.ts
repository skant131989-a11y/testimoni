import { PLAN_LIMITS, type PlanType } from "@/lib/constants";

/**
 * Resolves the effective plan for a workspace.
 *
 * If the workspace slug appears in the PRO_OVERRIDE_WORKSPACES env var
 * (comma-separated list), it's treated as PRO regardless of what the
 * Subscription row says. Used for the founder's own workspace + demo
 * accounts — no need to fake a Stripe/Razorpay subscription in the DB.
 *
 * Example env var:
 *   PRO_OVERRIDE_WORKSPACES=founder-workspace,demo-team
 */
export function getEffectivePlan(
  workspaceSlug: string | null | undefined,
  subscriptionPlan?: PlanType | null
): PlanType {
  if (workspaceSlug) {
    const overrides = (process.env.PRO_OVERRIDE_WORKSPACES || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (overrides.includes(workspaceSlug)) return "PRO";
  }
  return subscriptionPlan ?? "FREE";
}

/**
 * Resolves the plan limits object for a workspace, honoring the override.
 */
export function getEffectiveLimits(
  workspaceSlug: string | null | undefined,
  subscriptionPlan?: PlanType | null
): (typeof PLAN_LIMITS)[PlanType] {
  return PLAN_LIMITS[getEffectivePlan(workspaceSlug, subscriptionPlan)];
}
