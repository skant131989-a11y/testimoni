"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UpgradeProButton } from "@/components/upgrade-pro-button";
import { createClient } from "@/lib/supabase/client";
import { PRO_OFFER_PRICES, OFFER_END_LABEL, type ProOffers } from "@/lib/pro-offers-config";

/**
 * Pro price options under the regular price.
 *
 * While founding spots remain, the founding prices are the main choice
 * ($9 a month or $99 a year, locked while you stay subscribed). Once they
 * are gone, only the regular yearly option is offered ($149 a year). The two
 * are never shown together, so nobody compares a founding price with the
 * regular yearly one. Nothing shows to people who already pay.
 *
 * A visitor who is not logged in is sent to sign up first; a free account
 * goes straight to checkout.
 */
export function ProOffersBox({ surface, initial = null }: { surface: string; initial?: ProOffers | null }) {
  const [offers, setOffers] = useState<ProOffers | null>(initial);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/offers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setOffers(d as ProOffers);
      })
      .catch(() => {});
    createClient()
      .auth.getUser()
      .then(async ({ data }) => {
        if (cancelled || !data.user) return;
        setLoggedIn(true);
        try {
          const res = await fetch("/api/billing/subscription");
          if (!res.ok) return;
          const body = await res.json();
          const plan = body?.subscription?.plan ?? "FREE";
          if (!cancelled && plan !== "FREE") setIsPaid(true);
        } catch {
          // treat as free
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!offers || isPaid) return null;

  const signupHref = (src: string) => `/signup?src=${src}`;
  const P = PRO_OFFER_PRICES;

  if (offers.founding.available) {
    const { left, monthly, annual } = offers.founding;
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border-2 border-violet-600 bg-white text-left shadow-lg shadow-violet-900/10">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-violet-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white">
          <span>Year-end offer</span>
          <span className="text-violet-200">Ends {OFFER_END_LABEL}</span>
        </div>
        <div className="p-4">
          {monthly && (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold leading-none tracking-tight text-violet-950">${P.founding}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
                <span className="ml-1 text-base text-muted-foreground line-through">${P.monthly}</span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-violet-700">
                {left <= 10
                  ? `Only ${left} ${left === 1 ? "spot" : "spots"} left at this price`
                  : "Over half off Pro, for the rest of the year"}
              </p>
              <div className="mt-3">
                {loggedIn ? (
                  <UpgradeProButton offer="founding" surface={`${surface}_founding`} className="w-full" label={`Get Pro at $${P.founding}`} />
                ) : (
                  <Link href={signupHref("founding_monthly")} className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                    Get Pro at ${P.founding}
                  </Link>
                )}
              </div>
            </div>
          )}
          {annual && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-violet-50 px-3 py-2.5">
              <span className="text-sm">
                <span className="font-bold">or ${P.founding_annual} a year</span>
                <span className="text-muted-foreground"> · save ${P.founding * 12 - P.founding_annual}</span>
              </span>
              {loggedIn ? (
                <UpgradeProButton offer="founding_annual" surface={`${surface}_founding_annual`} size="sm" variant="outline" label="Choose yearly" />
              ) : (
                <Link href={signupHref("founding_annual")} className="rounded-md border border-violet-300 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-100">
                  Choose yearly
                </Link>
              )}
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Same Pro plan. Your price stays the same for as long as you stay subscribed; if you cancel and come back, it is the regular ${P.monthly}/month. Cancel any time.
          </p>
        </div>
      </div>
    );
  }

  if (offers.annual) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-left">
        <span className="text-sm">
          <span className="font-semibold">Pay yearly: ${P.annual}</span>
          <span className="text-muted-foreground"> · save ${P.monthly * 12 - P.annual} a year</span>
        </span>
        {loggedIn ? (
          <UpgradeProButton offer="annual" surface={`${surface}_annual`} size="sm" variant="outline" label="Choose yearly" />
        ) : (
          <Link href={signupHref("annual")} className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
            Choose yearly
          </Link>
        )}
      </div>
    );
  }

  return null;
}
