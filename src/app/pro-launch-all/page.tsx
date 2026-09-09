import { redirect } from "next/navigation";

/**
 * /pro-launch-all — same purpose as /pro-launch and /ask-demo:
 * the route exists only to host the OG image for launch tweets.
 * Any human loading the URL wants to buy — redirect to /pricing.
 */
export default function ProLaunchAllPage() {
  redirect("/pricing");
}
