"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface PreviewMeta {
  source: "db" | "fallback";
  error: string | null;
  recipient: { name: string; email: string };
  workspaceName: string;
  widgetId: string;
  founderName: string;
  founderEmail: string;
}

/**
 * Internal founder-email preview. Personal check-in sent from a
 * founder alias (default neha@testimoni.io) a few days after signup —
 * asks two direct questions and includes the user's wall URL.
 *
 * Same lookup-by-email pattern as the welcome preview.
 * NOT linked from nav. Gate this behind auth before opening publicly.
 */
export default function FounderEmailPreviewPage() {
  const [email, setEmail] = useState("");
  const [founderName, setFounderName] = useState("Neha Singh");
  const [founderEmail, setFounderEmail] = useState("neha@testimoni.io");
  const [previewNonce, setPreviewNonce] = useState(0);
  const [rawOpen, setRawOpen] = useState(false);
  const [rawHtml, setRawHtml] = useState("");
  const [meta, setMeta] = useState<PreviewMeta | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [copyRichOk, setCopyRichOk] = useState(false);

  const previewSrc = useMemo(() => {
    const params = new URLSearchParams({
      email,
      founderName,
      founderEmail,
      _: String(previewNonce),
    });
    return `/internal/founder-email/preview?${params.toString()}`;
  }, [email, founderName, founderEmail, previewNonce]);

  const fetchMeta = useCallback(async () => {
    const params = new URLSearchParams({
      email,
      founderName,
      founderEmail,
      json: "1",
    });
    const res = await fetch(`/internal/founder-email/preview?${params.toString()}`);
    const data = await res.json();
    setRawHtml(data.html);
    setMeta(data.meta);
  }, [email, founderName, founderEmail]);

  useEffect(() => {
    fetchMeta();
  }, [previewNonce, fetchMeta]);

  async function copyHtml() {
    if (!rawHtml) await fetchMeta();
    await navigator.clipboard.writeText(rawHtml);
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 2000);
  }

  /**
   * Copy rendered email as text/html + text/plain — pasting into Gmail
   * yields a fully rendered rich email. See welcome-email/page.tsx for
   * details on the ClipboardItem approach.
   */
  async function copyForGmail() {
    if (!rawHtml) await fetchMeta();
    const currentHtml = rawHtml || (await fetchAndReturn());
    try {
      const plain = stripTagsFallback(currentHtml);
      const item = new ClipboardItem({
        "text/html": new Blob([currentHtml], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      setCopyRichOk(true);
      setTimeout(() => setCopyRichOk(false), 2000);
    } catch {
      await navigator.clipboard.writeText(currentHtml);
      setCopyRichOk(true);
      setTimeout(() => setCopyRichOk(false), 2000);
    }
  }

  async function fetchAndReturn(): Promise<string> {
    const res = await fetch(previewSrc);
    const html = await res.text();
    setRawHtml(html);
    return html;
  }

  function stripTagsFallback(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&ldquo;|&rdquo;/g, '"')
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  const firstName = founderName.split(" ")[0];
  const subject = `Quick check-in from ${firstName}`;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Founder check-in email preview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Personal note from the founder — sent a few days after signup to
        ask for feedback. Enter a user&apos;s email; we pull their name +
        workspace + wall URL from the DB.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Recipient email
            </label>
            <input
              type="email"
              value={email}
              placeholder="user@example.com"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setPreviewNonce((n) => n + 1);
              }}
              className="mt-1 w-full rounded border px-2.5 py-1.5 text-sm"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Leave blank for a sample render.
            </p>
          </div>

          <div className="border-t pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Send from
            </p>
            <div className="mt-2">
              <label className="text-xs font-medium text-muted-foreground">
                Founder name
              </label>
              <input
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                className="mt-1 w-full rounded border px-2.5 py-1.5 text-sm"
              />
            </div>
            <div className="mt-2">
              <label className="text-xs font-medium text-muted-foreground">
                Founder email alias
              </label>
              <input
                type="email"
                value={founderEmail}
                onChange={(e) => setFounderEmail(e.target.value)}
                className="mt-1 w-full rounded border px-2.5 py-1.5 text-sm font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPreviewNonce((n) => n + 1)}
              className="w-full rounded bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Preview email
            </button>
            <button
              type="button"
              onClick={copyForGmail}
              className="w-full rounded border-2 border-primary bg-primary/5 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              {copyRichOk
                ? "✓ Copied — paste into Gmail"
                : "Copy email (paste into Gmail)"}
            </button>
            <button
              type="button"
              onClick={copyHtml}
              className="w-full rounded border py-2 text-sm font-medium hover:bg-muted"
            >
              {copyOk ? "✓ Copied HTML" : "Copy HTML source"}
            </button>
            <button
              type="button"
              onClick={() => setRawOpen((v) => !v)}
              className="w-full rounded border py-2 text-sm font-medium hover:bg-muted"
            >
              {rawOpen ? "Hide raw HTML" : "View raw HTML"}
            </button>
          </div>

          {meta && (
            <div className="mt-3 space-y-2 rounded border border-dashed p-3 text-xs">
              <div
                className={
                  meta.source === "db"
                    ? "inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-800"
                    : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800"
                }
              >
                {meta.source === "db" ? "Real DB data" : "Fallback (sample)"}
              </div>
              {meta.error && (
                <p className="text-[11px] text-amber-700">{meta.error}</p>
              )}
              <div className="mt-1 space-y-1">
                <p>
                  <span className="font-medium">First name:</span>{" "}
                  {meta.recipient.name}
                </p>
                <p>
                  <span className="font-medium">Workspace:</span>{" "}
                  {meta.workspaceName}
                </p>
                <p>
                  <span className="font-medium">Widget:</span>{" "}
                  <span className="font-mono text-[10px]">{meta.widgetId}</span>
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 rounded border border-dashed p-3 text-xs">
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
              Send envelope
            </p>
            <p className="mt-2">
              <strong className="font-medium">From:</strong>{" "}
              <span className="font-mono">
                {founderName} &lt;{founderEmail}&gt;
              </span>
            </p>
            <p className="mt-1">
              <strong className="font-medium">Reply-to:</strong>{" "}
              <span className="font-mono">{founderEmail}</span>
            </p>
            <p className="mt-1">
              <strong className="font-medium">To:</strong>{" "}
              <span className="font-mono">
                {meta?.recipient.email || "(enter email)"}
              </span>
            </p>
            <p className="mt-1">
              <strong className="font-medium">Subject:</strong> {subject}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Rendered email — 560px width, plain-text-ish feel like a real
            founder note
          </p>
          <iframe
            key={previewNonce}
            src={previewSrc}
            title="Founder check-in preview"
            className="h-[800px] w-full rounded border bg-white"
          />
        </div>
      </div>

      {rawOpen && (
        <div className="mt-6 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Raw HTML</p>
            <button
              type="button"
              onClick={() => setRawOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <pre className="mt-3 max-h-[400px] overflow-auto rounded bg-muted p-3 font-mono text-[11px] leading-relaxed">
            {rawHtml}
          </pre>
        </div>
      )}
    </div>
  );
}
