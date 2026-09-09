import { redirect } from "next/navigation";

/**
 * /ask-demo — bounces to /dashboard/ask-my-wall on the marketing
 * side, /pricing for anonymous visitors. The route's real job is
 * to host the Ask My Wall "wow moment" chat mock as an OG image
 * for a launch tweet reply — see opengraph-image.tsx.
 */
export default function AskDemoPage() {
  redirect("/pricing");
}
