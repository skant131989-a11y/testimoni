import type { Metadata } from "next";
import DemoClient from "./demo-client";

export const metadata: Metadata = {
  title: "Live demo — See Testimoni collect and display testimonials",
  description:
    "Try Testimoni's full flow: submit a testimonial, approve it in the inbox, curate it into a widget, and see it appear live. No sign-up required.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Live demo — Testimoni testimonial workflow",
    description:
      "Try the full collect → approve → curate → embed flow. No sign-up required.",
    url: "/demo",
  },
};

/**
 * Statically pre-rendered demo. DemoClient checks auth itself via
 * the Supabase browser SDK on mount so this page can be served
 * from the CDN edge.
 *
 * The Loved-by-founders strip renders inside DemoClient right
 * after its custom <header>, matching /pricing (strip below nav,
 * above hero). Inserting it here at the page level would push it
 * above DemoClient's header — wrong stacking order.
 */
export default function DemoPage() {
  return <DemoClient />;
}
