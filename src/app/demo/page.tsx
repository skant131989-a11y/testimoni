import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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

export default async function DemoPage() {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    isLoggedIn = false;
  }

  return <DemoClient isLoggedIn={isLoggedIn} />;
}
