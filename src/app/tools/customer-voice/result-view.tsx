"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Lock,
  Loader2,
  Sparkles,
  Plus,
  Mail,
  Download,
  Award,
  Swords,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import { addPendingTestimonial } from "@/lib/pending-testimonials";
import { detectCurrency, type Currency } from "@/lib/constants";
import "@/lib/razorpay-window";
import type { ScanCategory } from "@/lib/scan-report";
import type { RazorpayOrderCheckoutOptions } from "@/lib/razorpay-window";

export interface ApiMention {
  content: string;
  author: string;
  role?: string;
  source: string;
  sourceUrl?: string;
  categories: ScanCategory[];
  score: number;
  date?: string;
  competitorName?: string;
}

export interface ApiScanResult {
  id: string;
  brand: string;
  totalMentions: number;
  counts: Record<ScanCategory, number>;
  summary: {
    loves: string;
    dislikes: string;
    requests: string;
    howDescribed: string;
    whyChosen?: string;
  };
  mentions: ApiMention[];
  locked: boolean;
  tier: "quick" | "deep" | null;
  exportable: boolean;
  strongestSocialProof?: ApiMention[];
  competitorsMentioned?: { name: string; count: number }[];
  cached?: boolean;
  provider?: string;
  unlockToken?: string;
}

const CATEGORY_META: Record<ScanCategory, { emoji: string; label: string }> = {
  praise: { emoji: "❤️", label: "Praise" },
  complaint: { emoji: "😤", label: "Complaints" },
  feature_request: { emoji: "💡", label: "Feature requests" },
  use_case: { emoji: "🎯", label: "Use cases" },
  testimonial: { emoji: "🏆", label: "Testimonials" },
  outcome: { emoji: "📈", label: "Outcomes" },
  competitor_mention: { emoji: "⚔️", label: "Competitor mentions" },
};

const CATEGORY_ORDER: ScanCategory[] = [
  "praise",
  "complaint",
  "feature_request",
  "use_case",
  "testimonial",
  "outcome",
  "competitor_mention",
];

async function ensureRazorpayLoaded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-razorpay]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.dataset.razorpay = "true";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.head.appendChild(s);
  });
}

/**
 * Dev-only test override: `localStorage.setItem("currency", "USD")`
 * (or "INR") forces that currency on this tool without needing to
 * spoof the browser's timezone. Inert in production — real visitors
 * can't use this to pick their own price. Scoped to this file rather
 * than `detectCurrency()` itself, since that function also drives
 * the real Pro subscription checkout elsewhere — a testing override
 * has no business touching that path even in dev.
 */
function resolveCurrency(): Currency {
  if (process.env.NODE_ENV !== "production") {
    try {
      const override = window.localStorage.getItem("currency");
      if (override === "USD" || override === "INR") return override;
    } catch {
      // localStorage unavailable (SSR, blocked, private mode) — fall through
    }
  }
  return detectCurrency();
}

// Display-only "was" pricing for the discount badge — the actual
// charge always comes from the server's checkout response (env-var
// driven, see /api/scans/[id]/checkout/route.ts). These compare-at
// numbers don't have to reconcile to anything charged; they're a
// marketing anchor, same as any "was $X, now $Y" pattern.
interface TierPricing {
  current: string;
  was: string;
  discountPct: number;
}

const TIER_PRICING: Record<"quick" | "deep", Record<Currency, TierPricing>> = {
  quick: {
    USD: { current: "$9", was: "$19", discountPct: 53 },
    INR: { current: "₹749", was: "₹2,000", discountPct: 63 },
  },
  deep: {
    USD: { current: "$19", was: "$49", discountPct: 61 },
    INR: { current: "₹1,581", was: "₹4,000", discountPct: 60 },
  },
};

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(result: ApiScanResult) {
  const header = ["content", "author", "role", "source", "sourceUrl", "categories", "score", "date"];
  const rows = result.mentions.map((m) => [
    m.content,
    m.author,
    m.role ?? "",
    m.source,
    m.sourceUrl ?? "",
    m.categories.join(";"),
    String(m.score),
    m.date ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${result.brand.toLowerCase().replace(/\s+/g, "-")}-customer-report.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ScanResultView({
  result,
  onUnlocked,
}: {
  result: ApiScanResult;
  onUnlocked: (full: ApiScanResult) => void;
}) {
  const [email, setEmail] = useState("");
  const [checkingOutTier, setCheckingOutTier] = useState<"quick" | "deep" | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ScanCategory | "all">("all");
  // The unlock CTA sits at the bottom of the page (right where the
  // buyer just paid). Once payment succeeds, the newly-unlocked
  // evidence renders further up the page, out of view — scroll them
  // there so "I paid, where's my report?" isn't a real question.
  const evidenceRef = useRef<HTMLDivElement>(null);
  // Target for the reverse direction — clicking a locked "+N more"
  // line should jump the visitor down to the unlock CTA, not just
  // sit there doing nothing.
  const paywallRef = useRef<HTMLDivElement>(null);
  function scrollToPaywall() {
    paywallRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const mentionsByCategory = useMemo(() => {
    const map = new Map<ScanCategory, ApiMention[]>();
    for (const m of result.mentions) {
      for (const category of m.categories) {
        const list = map.get(category) ?? [];
        list.push(m);
        map.set(category, list);
      }
    }
    return map;
  }, [result.mentions]);

  function addToWall(m: ApiMention) {
    const key = `${m.author}:${m.content}`;
    addPendingTestimonial({
      content: m.content,
      author: m.author,
      role: m.role,
      source: m.source,
      sourceUrl: m.sourceUrl,
      origin: "customer_voice_scan",
    });
    setAdded((prev) => new Set(prev).add(key));
    track("scan_testimonial_imported", { scanId: result.id, categories: m.categories });
  }

  async function handleUnlock(tier: "quick" | "deep") {
    const trimmed = email.trim();
    if (!trimmed) return;
    setPayError(null);
    setCheckingOutTier(tier);
    const currency = resolveCurrency();
    track("scan_checkout_started", { scanId: result.id, currency, tier });
    try {
      await ensureRazorpayLoaded();
      const res = await fetch(`/api/scans/${result.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, tier, currency }),
      });
      const data = await res.json();
      if (!res.ok || !data.order_id) {
        setPayError(data.error || "Could not start checkout.");
        setCheckingOutTier(null);
        return;
      }
      if (!window.Razorpay) {
        setPayError("Payment didn't load. Please refresh and try again.");
        setCheckingOutTier(null);
        return;
      }

      const options: RazorpayOrderCheckoutOptions = {
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        name: "Testimoni",
        description: `${tier === "quick" ? "Quick Scan" : "Deep Report"} — ${result.brand}`,
        prefill: { email: trimmed },
        theme: { color: "#7c3aed" },
        handler: async (response) => {
          setVerifying(true);
          try {
            const vr = await fetch(`/api/scans/${result.id}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const vd = await vr.json();
            if (!vr.ok) {
              setPayError(vd.error || "Payment verification failed.");
              setVerifying(false);
              return;
            }
            track("scan_payment_verified", { scanId: result.id, tier });
            onUnlocked(vd as ApiScanResult);
            // Wait a tick for the parent's re-render (new mentions,
            // new "+N more" → none) to paint before measuring scroll
            // position — scrolling immediately can target stale
            // (pre-unlock) layout.
            requestAnimationFrame(() => {
              evidenceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          } catch {
            setPayError("Payment succeeded but we couldn't load your report. Refresh this page.");
            setVerifying(false);
          }
        },
        modal: { ondismiss: () => setCheckingOutTier(null) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Something went wrong.");
      setCheckingOutTier(null);
    }
  }

  const busy = checkingOutTier !== null || verifying;
  const visibleCategories = CATEGORY_ORDER.filter((cat) => result.counts[cat] > 0);
  const filteredCategories = filter === "all" ? visibleCategories : visibleCategories.filter((c) => c === filter);

  return (
    <div>
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
          Found it
        </div>
        <h2 className="text-4xl font-bold md:text-5xl">
          We found <span className="text-primary">{result.totalMentions}</span> customer
          conversations about <span className="text-primary">{result.brand}</span>
        </h2>
      </div>

      {/* Category counts */}
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {CATEGORY_ORDER.map((cat) => (
          <div key={cat} className="rounded-2xl border bg-card p-4 text-center">
            <div className="text-2xl">{CATEGORY_META[cat].emoji}</div>
            <div className="mt-1 text-2xl font-bold">{result.counts[cat]}</div>
            <div className="text-xs text-muted-foreground">{CATEGORY_META[cat].label}</div>
          </div>
        ))}
      </div>

      {/* AI summary */}
      <div className="mt-10 rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-4 w-4" /> What we found
        </div>
        <ul className="space-y-2 text-sm">
          <li><strong>Customers love:</strong> {result.summary.loves}</li>
          <li><strong>Customers dislike:</strong> {result.summary.dislikes}</li>
          <li><strong>Most requested:</strong> {result.summary.requests}</li>
          <li><strong>How they describe it:</strong> {result.summary.howDescribed}</li>
          {result.summary.whyChosen && (
            <li><strong>Why customers choose it:</strong> {result.summary.whyChosen}</li>
          )}
        </ul>
      </div>

      {/* Deep-tier only: strongest social proof + competitors mentioned */}
      {result.exportable && (result.strongestSocialProof?.length ?? 0) > 0 && (
        <div className="mt-6 rounded-2xl border-2 border-amber-300/50 bg-amber-50 p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-700">
            <Award className="h-4 w-4" /> Strongest social proof
          </div>
          <div className="space-y-3">
            {result.strongestSocialProof!.map((m, i) => (
              <p key={i} className="text-sm italic leading-relaxed text-amber-900">
                &ldquo;{m.content}&rdquo; <span className="not-italic text-amber-700">— {m.author}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {result.exportable && (result.competitorsMentioned?.length ?? 0) > 0 && (
        <div className="mt-6 rounded-2xl border-2 border-slate-300/60 bg-slate-50 p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-700">
            <Swords className="h-4 w-4" /> Competitors mentioned
          </div>
          <div className="flex flex-wrap gap-2">
            {result.competitorsMentioned!.map((c) => (
              <span key={c.name} className="rounded-full border bg-white px-3 py-1 text-sm font-medium">
                {c.name} <span className="text-muted-foreground">({c.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {result.exportable && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" className="gap-2" onClick={() => downloadCsv(result)}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      )}

      {/* Category filter bar + evidence — nothing to show when the
          scan found zero mentions, so this whole block is skipped
          in favor of the empty state below. */}
      {result.totalMentions > 0 && (
        <>
      <div ref={evidenceRef} className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
            filter === "all" ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"
          }`}
        >
          All
        </button>
        {visibleCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              filter === cat ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"
            }`}
          >
            {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label} ({result.counts[cat]})
          </button>
        ))}
      </div>

      {/* Evidence by category */}
      <div className="mt-6 space-y-8">
        {filteredCategories.map((cat) => {
          const shown = mentionsByCategory.get(cat) ?? [];
          const lockedCount = result.counts[cat] - shown.length;
          return (
            <div key={cat}>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <span>{CATEGORY_META[cat].emoji}</span> {CATEGORY_META[cat].label}
                <span className="text-sm font-normal text-muted-foreground">({result.counts[cat]})</span>
              </h3>
              <div className="space-y-3">
                {shown.map((m, i) => {
                  const key = `${m.author}:${m.content}`;
                  const canAdd = m.categories.includes("praise") || m.categories.includes("testimonial");
                  return (
                    <div key={i} className="rounded-xl border bg-card p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm italic leading-relaxed">&ldquo;{m.content}&rdquo;</p>
                        {m.sourceUrl && (
                          <a
                            href={m.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => track("scan_source_clicked", { scanId: result.id, category: cat })}
                            className="shrink-0 text-xs text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          {m.author}{m.role ? ` — ${m.role}` : ""} · {m.source}
                          {m.date ? ` · ${m.date}` : ""}
                        </p>
                        {canAdd && (
                          <button
                            type="button"
                            onClick={() => addToWall(m)}
                            disabled={added.has(key)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:text-muted-foreground"
                          >
                            <Plus className="h-3 w-3" /> {added.has(key) ? "Added" : "Add to Wall"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {lockedCount > 0 && (
                  <button
                    type="button"
                    onClick={scrollToPaywall}
                    className="flex w-full items-center gap-2 rounded-xl border border-dashed p-4 text-left text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Lock className="h-4 w-4" />
                    +{lockedCount} more {CATEGORY_META[cat].label.toLowerCase()} — unlock the report
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* Zero mentions — nothing to sell. Skip the paywall entirely
          and point straight at trying a different URL, instead of
          asking someone to pay for an empty report. */}
      {result.totalMentions === 0 && (
        <div className="mt-12 rounded-3xl border-2 border-dashed p-8 text-center">
          <h3 className="text-2xl font-bold md:text-3xl">Nothing public yet for {result.brand}</h3>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            We didn&rsquo;t find customer conversations we could verify. This happens for newer or
            lower-profile products — try a different URL, or go straight to your own customers instead.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tools/customer-voice">
              <Button size="lg" className="gap-2">
                <Search className="h-4 w-4" /> Scan another URL <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup?src=customer_voice_zero_results">
              <Button size="lg" variant="outline">
                Sign up and send a form to your customers
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Most walls start empty and grow from there — free, no credit card.
          </p>
        </div>
      )}

      {/* Unlock CTA — two tiers. Only when there's something to unlock. */}
      {result.locked && result.totalMentions > 0 && (
        <div ref={paywallRef} className="mt-12 rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-fuchsia-50 p-8">
          <h3 className="text-center text-2xl font-bold md:text-3xl">Unlock the report</h3>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            One-time payment, no subscription. Choose what you need for {result.brand}.
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
            {(["quick", "deep"] as const).map((tier) => {
              const pricing = TIER_PRICING[tier][resolveCurrency()];
              return (
                <div
                  key={tier}
                  className={`rounded-2xl border-2 bg-card p-5 ${tier === "deep" ? "border-primary" : ""}`}
                >
                  <p className="font-bold">
                    {tier === "quick" ? "Quick Scan" : "Deep Report"}
                    {" — "}
                    <span className="text-muted-foreground line-through">{pricing.was}</span>{" "}
                    {pricing.current}
                    <span className="ml-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                      {pricing.discountPct}% off
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tier === "quick"
                      ? "Every mention, every source link — no AI depth."
                      : "Everything in Quick Scan, plus strongest social proof, competitors mentioned, why customers choose it, and CSV export."}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-lg border bg-card px-3">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              disabled={busy}
            />
          </div>

          <div className="mx-auto mt-4 flex max-w-md flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={busy || !email.trim()}
              onClick={() => handleUnlock("quick")}
              className="flex-1 gap-2"
            >
              {checkingOutTier === "quick" && <Loader2 className="h-4 w-4 animate-spin" />}
              Get Quick Scan
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={busy || !email.trim()}
              onClick={() => handleUnlock("deep")}
              className="flex-1 gap-2"
            >
              {checkingOutTier === "deep" && <Loader2 className="h-4 w-4 animate-spin" />}
              Get Deep Report
            </Button>
          </div>
          {verifying && (
            <p className="mt-3 text-center text-sm text-muted-foreground">Confirming payment…</p>
          )}
          {payError && <p className="mt-3 text-center text-sm text-destructive">{payError}</p>}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            We&rsquo;ll also email you a link back to this report — no account needed.
          </p>
        </div>
      )}
    </div>
  );
}
