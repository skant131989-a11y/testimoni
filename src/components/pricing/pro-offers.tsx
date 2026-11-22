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
export function ProOffersBox({ surface }: { surface: string }) {
  const [offers, setOffers] = useState<ProOffers | null>(null);
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
      <div className="mt-4 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/70 p-4 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Year-end offer · ends {OFFER_END_LABEL}
        </p>
        <p className="mt-1 text-sm font-semibold text-violet-950">
          {left <= 10 ? `Only ${left} ${left === 1 ? "spot" : "spots"} left at this price` : "Over half off Pro, for the rest of the year"}
        </p>
        <div className="mt-3 space-y-2">
          {monthly && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-sm">
              <span className="text-sm">
                <span className="text-lg font-bold">${P.founding}</span>
                <span className="text-muted-foreground"> / month </span>
                <span className="text-xs text-muted-foreground line-through">${P.monthly}</span>
              </span>
              {loggedIn ? (
                <UpgradeProButton offer="founding" surface={`${surface}_founding`} size="sm" label="Get this price" />
              ) : (
                <Link href={signupHref("founding_monthly")} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  Get this price
                </Link>
              )}
            </div>
          )}
          {annual && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-sm">
              <span className="text-sm">
                <span className="text-lg font-bold">${P.founding_annual}</span>
                <span className="text-muted-foreground"> / year · save ${P.founding * 12 - P.founding_annual}</span>
              </span>
              {loggedIn ? (
                <UpgradeProButton offer="founding_annual" surface={`${surface}_founding_annual`} size="sm" label="Get this price" />
              ) : (
                <Link href={signupHref("founding_annual")} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  Get this price
                </Link>
              )}
            </div>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Same Pro plan. Your price stays the same for as long as you stay subscribed; if you cancel and come back, it is the regular
          ${P.monthly}/month. Cancel any time.
        </p>
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
