"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

/**
 * Above-fold email-only CTA that hands off to /signup with the email
 * pre-filled. Removes a full step from the conversion funnel — the
 * visitor only types once, on the surface they first landed on.
 *
 * Not a real signup — just a hand-off. We don't want to move Supabase
 * calls into the hero (bundle cost + timing gates + honeypot).
 */
interface HeroEmailCtaProps {
  source: string;
  ctaLabel?: string;
}

export function HeroEmailCta({ source, ctaLabel = "Get my Wall of Love" }: HeroEmailCtaProps) {
  const [email, setEmail] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    track("hero_email_submitted", { source }, { instant: true });
    const q = email ? `?email=${encodeURIComponent(email)}` : "";
    router.push(`/signup${q}`);
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@work.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <Button type="submit" size="lg" className="h-12 shrink-0 gap-2">
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
