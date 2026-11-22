import { prisma } from "@/lib/prisma";
import { FOUNDING_SEATS, OFFER_ENDS_AT, type ProOffers, type ProVariant } from "@/lib/pro-offers-config";

/**
 * Server side of the Pro price options: which Razorpay plan each option
 * uses (set as environment variables), and how many founding spots are left.
 * An option with no plan id set simply does not exist: it is never shown and
 * checkout refuses it.
 */
const ENV_NAME: Record<Exclude<ProVariant, "monthly">, string> = {
  annual: "RAZORPAY_PRO_PLAN_ID_ANNUAL",
  founding: "RAZORPAY_PRO_PLAN_ID_FOUNDING",
  founding_annual: "RAZORPAY_PRO_PLAN_ID_FOUNDING_ANNUAL",
};

export function variantPlanId(variant: ProVariant): string | undefined {
  if (variant === "monthly") return undefined;
  return process.env[ENV_NAME[variant]] || undefined;
}

/** Founding spots taken so far: paying workspaces on either founding plan. */
export async function foundingSeatsLeft(): Promise<number> {
  // The offer ends on a date, whatever is left.
  if (Date.now() >= new Date(OFFER_ENDS_AT).getTime()) return 0;
  const ids = [variantPlanId("founding"), variantPlanId("founding_annual")].filter((x): x is string => Boolean(x));
  if (ids.length === 0) return 0;
  const taken = await prisma.subscription.count({
    where: { razorpayPlanId: { in: ids }, plan: { not: "FREE" } },
  });
  return Math.max(0, FOUNDING_SEATS - taken);
}

export async function getProOffers(): Promise<ProOffers> {
  const left = await foundingSeatsLeft();
  const foundingMonthly = Boolean(variantPlanId("founding"));
  const foundingAnnual = Boolean(variantPlanId("founding_annual"));
  return {
    founding: { available: left > 0 && (foundingMonthly || foundingAnnual), left, monthly: foundingMonthly, annual: foundingAnnual },
    annual: Boolean(variantPlanId("annual")),
  };
}
