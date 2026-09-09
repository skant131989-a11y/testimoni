import { redirect } from "next/navigation";

/**
 * /launch-banner — hosts the three-flow launch banner OG image.
 * Human visitors want to buy; redirect to /pricing.
 */
export default function LaunchBannerPage() {
  redirect("/pricing");
}
