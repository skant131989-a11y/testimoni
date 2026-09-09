import { redirect } from "next/navigation";

/**
 * /pro-launch — a lightweight landing that just kicks visitors to
 * /pricing. Its real purpose is to host the opengraph-image and
 * twitter-image so we can share a single launch link with a rich
 * card. Anyone actually loading the URL wants to buy, so bounce
 * them to pricing.
 */
export default function ProLaunchPage() {
  redirect("/pricing");
}
