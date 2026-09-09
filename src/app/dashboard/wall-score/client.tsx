"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gauge, TrendingUp, TrendingDown, Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { UpgradeProButton } from "@/components/upgrade-pro-button";
import type { PlanType } from "@/lib/constants";

type Audit = {
  id: string;
  score: number;
  breakdown: {
    volume: number;
    diversity: number;
    recency: number;
    video: number;
    verified: number;
    ratings: number;
  };
  recommendations: Array<{
    issue: string;
    suggestion: string;
    dimension: string;
  }>;
  totalTestimonials: number;
  approvedCount: number;
  videoCount: number;
  createdAt: string;
};

type Props = {
  initialAudits: Audit[];
  totalAudits: number;
  plan: PlanType;
  workspaceName: string;
};

const DIMENSIONS = [
  { key: "volume", label: "Volume", max: 25 },
  { key: "diversity", label: "Source diversity", max: 15 },
  { key: "recency", label: "Recency", max: 15 },
  { key: "video", label: "Video presence", max: 15 },
  { key: "verified", label: "Verified sources", max: 15 },
  { key: "ratings", label: "Rating average", max: 15 },
] as const;

export function WallScoreClient({ initialAudits, totalAudits, plan, workspaceName }: Props) {
  const [audits, setAudits] = useState(initialAudits);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const latest = audits[audits.length - 1];
  const previous = audits.length > 1 ? audits[audits.length - 2] : null;
  const delta = latest && previous ? latest.score - previous.score : null;

  async function runAudit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/wall-score/audit", { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || data.error || "Audit failed");
          return;
        }
        setAudits((prev) => [...prev, data.audit]);
        track("wall_score_audit_run", { score: data.audit.score });
      } catch (e) {
        setError("Network error");
      }
    });
  }

  const canAudit = plan !== "FREE" || totalAudits < 1;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Wall Score</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            How strong is <span className="font-medium">{workspaceName}</span>'s
            Wall of Love — measured across 6 dimensions that drive conversion.
          </p>
        </div>
        <Button onClick={runAudit} disabled={!canAudit || pending}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running audit…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run new audit
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">{error}</p>
              {!canAudit && (
                <p className="mt-1 text-muted-foreground">
                  Free plan includes 1 lifetime audit — <Link href="/pricing" className="font-medium underline">upgrade to Pro</Link> for unlimited audits + weekly reports.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!latest ? (
        <EmptyState canAudit={canAudit} onRunAudit={runAudit} pending={pending} />
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <ScoreCard score={latest.score} delta={delta} createdAt={latest.createdAt} totalTestimonials={latest.approvedCount} />
          <BreakdownCard audit={latest} />
        </div>
      )}

      {audits.length >= 2 && (
        <div className="mt-6 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Trend</h2>
          <p className="text-sm text-muted-foreground">Last {audits.length} audits</p>
          <TrendGraph audits={audits} />
        </div>
      )}

      {latest && latest.recommendations.length > 0 && (
        <div className="mt-6 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Recommendations</h2>
          <p className="text-sm text-muted-foreground">Fix these to lift your score.</p>
          <ul className="mt-4 space-y-4">
            {latest.recommendations.map((r, i) => (
              <li key={i} className="rounded-lg border bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                    <AlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{r.issue}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{r.suggestion}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan === "FREE" && (
        <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold">Track your score over time</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pro plan unlocks unlimited audits, a trend graph, and a weekly emailed report so you know if your wall is improving.
          </p>
          <Link href="/pricing" className="mt-4 inline-block">
            <Button variant="link" className="h-auto p-0 text-sm">See what&rsquo;s in Pro →</Button>
          </Link>
          <div className="mt-4">
            <UpgradeProButton surface="wall_score_upgrade_card" label="Upgrade to Pro — $9/mo" />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ canAudit, onRunAudit, pending }: { canAudit: boolean; onRunAudit: () => void; pending: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed p-12 text-center">
      <Gauge className="mx-auto h-12 w-12 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold">Run your first Wall Score</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Get a 0-100 score, per-dimension breakdown, and a specific next action to lift each dimension.
      </p>
      <Button onClick={onRunAudit} disabled={!canAudit || pending} className="mt-6">
        {pending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running…</>
        ) : (
          <><Sparkles className="mr-2 h-4 w-4" />Run audit</>
        )}
      </Button>
    </div>
  );
}

function ScoreCard({ score, delta, createdAt, totalTestimonials }: { score: number; delta: number | null; createdAt: string; totalTestimonials: number }) {
  const grade = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs work" : "Weak";
  const gradeColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-blue-600" : score >= 40 ? "text-amber-600" : "text-red-600";
  return (
    <div className="rounded-2xl border bg-card p-6">
      <p className="text-sm text-muted-foreground">Current score</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-6xl font-bold">{score}</span>
        <span className="text-2xl text-muted-foreground">/100</span>
      </div>
      <p className={`mt-2 text-lg font-semibold ${gradeColor}`}>{grade}</p>
      {delta !== null && (
        <p className="mt-3 flex items-center gap-1.5 text-sm">
          {delta > 0 ? (
            <><TrendingUp className="h-4 w-4 text-emerald-600" /><span className="text-emerald-600 font-medium">+{delta}</span></>
          ) : delta < 0 ? (
            <><TrendingDown className="h-4 w-4 text-red-600" /><span className="text-red-600 font-medium">{delta}</span></>
          ) : (
            <span className="text-muted-foreground">No change</span>
          )}
          <span className="text-muted-foreground">since last audit</span>
        </p>
      )}
      <div className="mt-4 border-t pt-4 text-sm text-muted-foreground">
        <p>Based on {totalTestimonials} approved testimonial{totalTestimonials === 1 ? "" : "s"}</p>
        <p className="mt-1 text-xs">Audited {new Date(createdAt).toLocaleString()}</p>
      </div>
    </div>
  );
}

function BreakdownCard({ audit }: { audit: Audit }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="text-lg font-semibold">Breakdown</h2>
      <ul className="mt-4 space-y-3">
        {DIMENSIONS.map((d) => {
          const value = audit.breakdown[d.key];
          const pct = (value / d.max) * 100;
          const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 25 ? "bg-amber-500" : "bg-red-500";
          return (
            <li key={d.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{d.label}</span>
                <span className="text-muted-foreground">{value}/{d.max}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TrendGraph({ audits }: { audits: Audit[] }) {
  // SVG line chart. Kept dependency-free — recharts adds ~50KB and
  // this is a single sparkline. 12 points max, so a simple polyline is fine.
  const W = 640;
  const H = 160;
  const pad = 32;
  const max = 100;
  const points = audits.map((a, i) => {
    const x = pad + (i / Math.max(1, audits.length - 1)) * (W - pad * 2);
    const y = H - pad - (a.score / max) * (H - pad * 2);
    return { x, y, audit: a };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${path} L ${points[points.length - 1].x} ${H - pad} L ${points[0].x} ${H - pad} Z`;

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[500px] w-full">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="currentColor" className="text-muted-foreground/30" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="currentColor" className="text-muted-foreground/30" />
        <text x={4} y={pad + 4} className="fill-muted-foreground text-[10px]">100</text>
        <text x={4} y={H - pad + 4} className="fill-muted-foreground text-[10px]">0</text>
        <path d={areaPath} className="fill-primary/10" />
        <path d={path} className="fill-none stroke-primary stroke-2" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} className="fill-primary" />
            <title>{`${new Date(p.audit.createdAt).toLocaleDateString()}: ${p.audit.score}/100`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
