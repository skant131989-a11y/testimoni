"use client";

import { useState } from "react";
import {
  ExternalLink,
  MessageSquareQuote,
  Sparkles,
  Check,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { leadOutreachEmailHtml } from "@/lib/emails/lead-outreach";

export interface LeadCard {
  id: string;
  companyName: string | null;
  productName: string | null;
  website: string;
  founderName: string | null;
  founderSocial: string | null;
  publicBusinessEmail: string | null;
  source: string;
  sourceUrl: string;
  category: string | null;
  score: number;
  scoreReason: string;
  socialProofStatus: string;
  status: string;
  praiseCount: number;
  praiseSignals: { source: string; url: string; excerpt: string; author: string | null }[];
  createdAt: string;
  lastSeenAt: string;
}

const SOCIAL_PROOF_LABEL: Record<string, { label: string; className: string }> = {
  NO_SOCIAL_PROOF: { label: "No social proof", className: "bg-rose-100 text-rose-700" },
  WEAK_SOCIAL_PROOF: { label: "Weak social proof", className: "bg-amber-100 text-amber-700" },
  HAS_TESTIMONIALS: { label: "Has testimonials", className: "bg-blue-100 text-blue-700" },
  STRONG_SOCIAL_PROOF: { label: "Strong social proof", className: "bg-emerald-100 text-emerald-700" },
  UNKNOWN: { label: "Not inspected", className: "bg-slate-100 text-slate-600" },
};

function scoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-600 text-white";
  if (score >= 60) return "bg-violet-600 text-white";
  if (score >= 40) return "bg-amber-500 text-white";
  return "bg-slate-400 text-white";
}

export function LeadList({ initial, view }: { initial: LeadCard[]; view: string }) {
  const [leads, setLeads] = useState(initial);

  function removeLead(id: string) {
    setLeads((ls) => ls.filter((l) => l.id !== id));
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Nothing in this view yet. Run a scan, or check another tab.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <LeadCardView key={lead.id} lead={lead} view={view} onStatusChanged={() => removeLead(lead.id)} />
      ))}
    </div>
  );
}

function LeadCardView({
  lead,
  view,
  onStatusChanged,
}: {
  lead: LeadCard;
  view: string;
  onStatusChanged: () => void;
}) {
  const [showPraise, setShowPraise] = useState(false);
  const [variant, setVariant] = useState<"wall" | "hook" | "paid_scan">("wall");
  const [preparing, setPreparing] = useState(false);
  const [preview, setPreview] = useState<{ to: string | null; subject: string; body: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [showStyled, setShowStyled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busyStatus, setBusyStatus] = useState<string | null>(null);

  const proof = SOCIAL_PROOF_LABEL[lead.socialProofStatus] ?? SOCIAL_PROOF_LABEL.UNKNOWN;

  async function setStatus(status: string) {
    setBusyStatus(status);
    track("admin_lead_status_changed", { leadId: lead.id, status, view });
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) onStatusChanged();
    } finally {
      setBusyStatus(null);
    }
  }

  async function prepareEmail() {
    setPreparing(true);
    setSendResult(null);
    track("admin_outreach_prepared", { leadId: lead.id, variant });
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/prepare-email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variant }),
      });
      const data = await res.json();
      if (res.ok) setPreview({ to: data.to, subject: data.subject, body: data.body });
      else setSendResult(data.error || "Could not prepare the email.");
    } catch {
      setSendResult("Could not prepare the email.");
    } finally {
      setPreparing(false);
    }
  }

  async function sendPreviewedEmail() {
    if (!preview?.to) return;
    setSending(true);
    setSendResult(null);
    track("admin_lead_email_sent", { leadId: lead.id });
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/send-email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...preview, variant }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult("Sent.");
        onStatusChanged();
      } else {
        setSendResult(data.error || "Send failed.");
      }
    } catch {
      setSendResult("Send failed — network error.");
    } finally {
      setSending(false);
    }
  }

  async function copyDraft() {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${preview.subject}\n\n${preview.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold">
                {lead.companyName || lead.website}
              </h3>
              {lead.productName && lead.productName !== lead.companyName && (
                <span className="text-sm text-muted-foreground">— {lead.productName}</span>
              )}
              {lead.category && (
                <Badge variant="outline" className="text-xs">
                  {lead.category}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{lead.website}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", scoreColor(lead.score))}>
              {lead.score}
            </span>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", proof.className)}>
              {proof.label}
            </span>
          </div>
        </div>

        {lead.scoreReason && (
          <p className="mt-3 text-sm text-muted-foreground">{lead.scoreReason}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {lead.founderName && <span>👤 {lead.founderName}</span>}
          {lead.founderSocial && (
            <a href={lead.founderSocial} target="_blank" rel="noopener noreferrer" className="underline">
              Founder profile
            </a>
          )}
          {lead.publicBusinessEmail && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> {lead.publicBusinessEmail}
            </span>
          )}
          {/* No verified contact from a provider — hand the admin a
              one-click manual lookup instead of leaving them to type
              a search themselves. Search terms, not a guessed handle
              or email: we never invent contact info. */}
          {!lead.founderSocial && !lead.publicBusinessEmail && (
            <>
              <a
                href={`https://x.com/search?q=${encodeURIComponent(
                  lead.founderName || lead.productName || lead.companyName || lead.website
                )}&src=typed_query&f=user`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Find on X
              </a>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `"${lead.founderName || lead.productName || lead.companyName || lead.website}" twitter OR linkedin OR contact`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Search contact
              </a>
            </>
          )}
          <span>
            {lead.praiseCount} praise signal{lead.praiseCount === 1 ? "" : "s"}
          </span>
          <span className="capitalize">status: {lead.status.toLowerCase().replace(/_/g, " ")}</span>
        </div>

        {lead.praiseSignals.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowPraise((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <MessageSquareQuote className="h-3.5 w-3.5" />
              {showPraise ? "Hide praise" : `View praise (${lead.praiseSignals.length})`}
              {showPraise ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showPraise && (
              <ul className="mt-2 space-y-2 border-l-2 pl-3">
                {lead.praiseSignals.map((s, i) => (
                  <li key={i} className="text-sm">
                    <p className="italic text-foreground/90">&ldquo;{s.excerpt}&rdquo;</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.author ? `${s.author} · ` : ""}
                      {s.source} ·{" "}
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                        source
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {preview && (
          <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Preview — nothing sent yet, edit freely below
              </p>
              <Button size="sm" variant="outline" onClick={copyDraft} className="h-7 gap-1 text-xs">
                <Copy className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <label className="mb-2 block text-xs text-muted-foreground">
              To
              <input
                type="email"
                value={preview.to ?? ""}
                onChange={(e) => setPreview({ ...preview, to: e.target.value })}
                placeholder="No email found for this lead — add one to enable Send"
                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-sm text-foreground"
              />
            </label>
            <label className="mb-2 block text-xs text-muted-foreground">
              Subject
              <input
                value={preview.subject}
                onChange={(e) => setPreview({ ...preview, subject: e.target.value })}
                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-sm text-foreground"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Body
              <textarea
                value={preview.body}
                onChange={(e) => setPreview({ ...preview, body: e.target.value })}
                rows={6}
                className="mt-0.5 w-full rounded border bg-background px-2 py-1.5 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowStyled((v) => !v)}
              className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
              {showStyled ? "Hide styled preview" : "Show styled preview (exactly what gets sent) →"}
            </button>
            {showStyled && (
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={leadOutreachEmailHtml({
                  bodyText: preview.body,
                  senderName: "Neha",
                  senderEmail: "neha@testimoni.io",
                  leadWebsite: lead.website,
                  variant,
                })}
                className="mt-2 h-96 w-full rounded border bg-white"
              />
            )}
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                onClick={sendPreviewedEmail}
                disabled={sending || !preview.to}
                className="gap-1"
              >
                <Mail className="h-3.5 w-3.5" /> {sending ? "Sending…" : "Send"}
              </Button>
              {sendResult && <p className="text-xs text-muted-foreground">{sendResult}</p>}
            </div>
          </div>
        )}

        {lead.praiseSignals.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Email angle:</span>
            {(
              [
                { v: "wall" as const, label: "1 · Wall of Love" },
                { v: "hook" as const, label: "2 · Curiosity + $9/mo" },
                { v: "paid_scan" as const, label: "3 · $9 Scan pitch" },
              ]
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setVariant(opt.v)}
                className={cn(
                  "rounded-full border px-2.5 py-1 font-medium",
                  variant === opt.v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="gap-1">
            <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Open Website
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1">
            <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Source
            </a>
          </Button>
          <Button
            size="sm"
            onClick={prepareEmail}
            disabled={preparing || lead.praiseSignals.length === 0}
            className="gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {preparing ? "Preparing…" : preview ? "Regenerate Email" : "Prepare Email"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={busyStatus === "CONTACTED"}
            onClick={() => setStatus("CONTACTED")}
          >
            <Check className="h-3.5 w-3.5" /> Mark Contacted
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 text-muted-foreground"
            disabled={busyStatus === "IGNORED"}
            onClick={() => setStatus("IGNORED")}
          >
            <X className="h-3.5 w-3.5" /> Ignore
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
