"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracked-link";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side auth section for the public marketing nav. Renders
 * anonymous-user state (Log in + Get Started Free) on first paint
 * so the whole PublicNav can be a static server component and every
 * marketing page can be pre-rendered at build time.
 *
 * On mount, checks Supabase auth via the browser SDK (reads the
 * session cookie the middleware already keeps fresh) and swaps to
 * a "Dashboard" button if logged in.
 *
 * Trade-off: logged-in visitors see the default "Log in / Get
 * Started" chrome for ~50-200ms before it swaps to "Dashboard".
 * Anonymous visitors — the majority — see the correct state
 * immediately. Same pattern Vercel, Linear, Stripe use.
 */
/** Testimonials waiting for approval, for a logged-in visitor on the public site. */
function usePendingInbox(isLoggedIn: boolean | null): number {
  const [pending, setPending] = useState(0);
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    fetch("/api/inbox/count", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.pending === "number") setPending(d.pending);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);
  return pending;
}

export function PublicNavAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const pending = usePendingInbox(isLoggedIn);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setIsLoggedIn(!!data.user);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Anonymous default while we're still checking (or on cold SSR).
  // Once we know for sure, render the appropriate variant.
  if (isLoggedIn) {
    return (
      <>
        <Button size="sm" asChild className="relative">
          <TrackedLink cta="nav_dashboard" surface="public_nav" href="/dashboard">
            Dashboard
            {pending > 0 && (
              <span
                className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                aria-label={`${pending} testimonials waiting for approval`}
              >
                {pending > 99 ? "99+" : pending}
              </span>
            )}
          </TrackedLink>
        </Button>
      </>
    );
  }

  return (
    <>
      <TrackedLink cta="nav_login" surface="public_nav" href="/login">
        <Button variant="ghost" size="sm">
          Log in
        </Button>
      </TrackedLink>
      <TrackedLink cta="nav_signup" surface="public_nav" href="/signup">
        <Button size="sm">Get Started Free</Button>
      </TrackedLink>
    </>
  );
}

/**
 * Mobile version — Demo link + one primary CTA. Same anonymous
 * default with a logged-in swap after mount.
 *
 * "Demo" text link is kept because on desktop it lives in the full
 * nav (Live Demo / Features / Pricing); on mobile the rest are OK to
 * hide but the demo is a real conversion path for the curious-but-
 * not-ready visitor, so it stays as a small text link next to the CTA.
 */
export function PublicNavAuthMobile() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const pending = usePendingInbox(isLoggedIn);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setIsLoggedIn(!!data.user);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex items-center gap-3 md:hidden">
      {!isLoggedIn && (
        <>
          <TrackedLink
            cta="nav_mobile_demo"
            surface="public_nav"
            href="/demo"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Demo
          </TrackedLink>
          <TrackedLink
            cta="nav_mobile_tools"
            surface="public_nav"
            href="/tools"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Tools
          </TrackedLink>
        </>
      )}
      <TrackedLink
        cta="nav_mobile_cta"
        surface="public_nav"
        href={isLoggedIn ? "/dashboard" : "/signup"}
      >
        <Button size="sm">
          {isLoggedIn ? "Dashboard" : "Start free"}
          {isLoggedIn && pending > 0 && (
            <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {pending > 99 ? "99+" : pending}
            </span>
          )}
        </Button>
      </TrackedLink>
    </div>
  );
}
