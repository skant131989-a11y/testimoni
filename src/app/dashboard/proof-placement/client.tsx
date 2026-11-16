"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Copy, Check, Loader2, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import type { PlanType } from "@/lib/constants";
import type { PageAudit, ProofAuditResult } from "@/lib/proof-placement";

const PRIORITY: Record<PageAudit["priority"], { label: string; cls: string }> = {
  high: { label: "Add proof here first", cls: "bg-red-100 text-red-800" },
  medium: { label: "Worth adding", cls: "bg-amber-100 text-amber-800" },
  low: { label: "Nice to have", cls: "bg-slate-100 text-slate-700" },
  ok: { label: "Has proof", cls: "bg-emerald-100 text-emerald-800" },
};

function CopyQuote({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function ProofPlacementClient({
  initial,
  defaultUrl,
  canRun,
  plan,
}: {
  initial: ProofAuditResult | null;
  defaultUrl: string;
  canRun: boolean;
  plan: PlanType;
}) {
  const [url, setUrl] = useState(defaultUrl);
  const [result, setResult] = useState<ProofAuditResult | null>(initial);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(canRun);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || running) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/proof-placement/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "The audit failed. Try again.");
        if (res.status === 402) setAllowed(false);
        return;
      }
      setResult(data.result);
      if (plan === "FREE") setAllowed(false);
      track("proof_audit_run", {
        pages: data.result.summary.pagesChecked,
        without_proof: data.result.summary.withoutProof,
        wall_quotes: data.result.wallQuotes,
      });
    } catch {
      setError("Network hiccup. Try again in a moment.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Proof placement</h1>
      </div>
      <p className="mt-2 text-muted-foreground">
        Visitors decide on your pricing, home and feature pages. We read them, find the ones with no customer proof, and
        pick the testimonials from your wall that belong on each.
      </p>

      <form onSubmit={run} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourwebsite.com"
          disabled={running || !allowed}
          className="flex-1"
        />
        <Button type="submit" disabled={running || !allowed || !url.trim()} className="gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {result ? "Audit again" : "Audit my site"}
        </Button>
      </form>
      {!allowed && (
        <p className="mt-2 text-sm text-muted-foreground">
          Your free audit is used.{" "}
          <Link href="/pricing" className="font-medium text-primary underline-offset-4 hover:underline">
            Pro
          </Link>{" "}
          re-runs it whenever you change your site or add testimonials.
        </p>
      )}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}
      {running && <p className="mt-4 text-sm text-muted-foreground">Reading your pages. This takes about 15 seconds.</p>}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="text-3xl font-bold">{result.summary.pagesChecked}</div>
              <div className="text-sm text-muted-foreground">pages read on {result.siteUrl.replace(/^https?:\/\//, "")}</div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className={`text-3xl font-bold ${result.summary.withoutProof > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {result.summary.withoutProof}
              </div>
              <div className="text-sm text-muted-foreground">pages with no customer proof</div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-3xl font-bold">{result.wallQuotes}</div>
              <div className="text-sm text-muted-foreground">approved quotes on your wall</div>
            </div>
          </div>

          {result.note && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              {result.note}{" "}
              <Link href="/tools/find-my-proof" className="font-semibold underline">
                Find praise about you
              </Link>
              .
            </div>
          )}

          <div className="space-y-4">
            {result.pages.map((p) => (
              <div key={p.url} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY[p.priority].cls}`}>
                    {PRIORITY[p.priority].label}
                  </span>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                    {p.path === "/" ? "Home page" : p.path}
                  </a>
                  <span className="truncate text-sm text-muted-foreground">{p.title}</span>
                </div>
                <p className="mt-3 flex items-start gap-2 text-sm">
                  {p.hasProof ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  )}
                  {p.recommendation}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">This page talks about: {p.themes.join(", ")}</p>

                <div className="mt-4 space-y-3">
                  {p.matches.map((m) => (
                    <div key={m.topic}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m.label}</p>
                      {m.quotes.length > 0 ? (
                        <div className="mt-1 space-y-2">
                          {m.quotes.map((q, i) => (
                            <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 p-3">
                              <p className="text-sm italic">
                                &ldquo;{q.content}&rdquo;{" "}
                                <span className="not-italic text-muted-foreground">
                                  — {q.author}
                                  {q.title ? `, ${q.title}` : ""}
                                </span>
                              </p>
                              <CopyQuote text={`“${q.content}” — ${q.author}${q.title ? `, ${q.title}` : ""}`} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                          No quote about this yet. Ask a customer: &ldquo;{m.ask}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {!p.hasProof && (
                  <div className="mt-4">
                    <Link href="/dashboard/widgets">
                      <Button size="sm" variant="outline">
                        Get the embed code for your wall
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {result.summary.missingTopics.length > 0 && (
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
              <p className="font-semibold">Quotes your pages need but your wall doesn&rsquo;t have yet</p>
              <ul className="mt-2 space-y-1 text-sm">
                {result.summary.missingTopics.map((m) => (
                  <li key={m.label}>
                    <strong>{m.label}:</strong> ask customers &ldquo;{m.ask}&rdquo;
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/requests" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                Send a request to customers
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
