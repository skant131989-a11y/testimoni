"use client";

import { detectCurrency, type Currency } from "@/lib/constants";

let cached: Promise<Currency> | null = null;

/**
 * Display currency from the visitor's IP country (India → INR, anywhere
 * else → USD). Follows a VPN, unlike the browser timezone. Falls back to
 * the timezone guess only when the edge doesn't report a country (local
 * dev) or the request fails. One request per page load, shared by every
 * caller.
 */
export function resolveCurrencyByGeo(): Promise<Currency> {
  if (!cached) {
    cached = fetch("/api/geo", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data): Currency => {
        const country: unknown = data?.country;
        if (typeof country === "string" && country) return country === "IN" ? "INR" : "USD";
        return detectCurrency();
      })
      .catch(() => detectCurrency());
  }
  return cached;
}
