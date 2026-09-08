"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * Live signup ticker — thin pill that rotates through the last
 * 24 hours of REAL signups (name-only, no emails), pulled once
 * on mount from a lightweight public endpoint. Sits above the
 * hero H1 to create instant social proof: "these people just
 * signed up too."
 *
 * Data source: /api/public/recent-signups — returns anonymised
 * first names + relative time. Endpoint filters out demo/test
 * accounts server-side.
 *
 * If the endpoint returns empty (fresh install, no signups yet),
 * the ticker renders nothing — no fake "someone just signed up!"
 * lies.
 */
interface Signup {
  name: string;
  minutesAgo: number;
}

export function LiveSignupTicker() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/recent-signups")
      .then((r) => (r.ok ? r.json() : { signups: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data.signups)) {
          setSignups(data.signups);
        }
      })
      .catch(() => {
        // Silent — ticker just doesn't render.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (signups.length <= 1) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % signups.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(t);
  }, [signups.length]);

  if (signups.length === 0) return null;
  const current = signups[idx];
  const timeLabel =
    current.minutesAgo < 60
      ? `${current.minutesAgo} min ago`
      : `${Math.round(current.minutesAgo / 60)}h ago`;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <Sparkles className="h-3 w-3" />
      <span>
        <strong className="font-semibold">{current.name}</strong> just
        signed up · {timeLabel}
      </span>
    </div>
  );
}
