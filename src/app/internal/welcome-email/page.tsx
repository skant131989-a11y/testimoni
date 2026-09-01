"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface PreviewMeta {
  source: "db" | "fallback";
  error: string | null;
  recipient: { name: string; email: string };
  workspaceName: string;
  workspaceSlug: string;
  widgetId: string;
  formSlug: string;
}

/**
 * Internal welcome-email preview. Enter an email; we look up the user
 * + workspace + first widget + first form from the DB and render the
 * real email with the real data. Falls back to a synthetic "Alex"
 * example when the email is missing or unmatched so the page never
 * blanks out.
 *
 * NOT linked from nav — visit /internal/welcome-email directly. If we
 * ever open beyond staging, gate behind an auth check.
 */
export default function WelcomeEmailPreviewPage() {
  const [email, setEmail] = useState("");
  const [previewNonce, setPreviewNonce] = useState(0);
  const [rawOpen, setRawOpen] = useState(false);
  const [rawHtml, setRawHtml] = useState("");
  const [meta, setMeta] = useState<PreviewMeta | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [copyRichOk, setCopyRichOk] = useState(false);

  const previewSrc = useMemo(() => {
    const params = new URLSearchParams({
      email,
      _: String(previewNonce),
    });
    return `/internal/welcome-email/preview?${params.toString()}`;
  }, [email, previewNonce]);

  // Fetch meta + raw HTML in one call whenever the preview refreshes
  // so we can show what the DB actually returned (or if it fell back).
  const fetchMeta = useCallback(async () => {
    const params = new URLSearchParams({ email, json: "1" });
    const res = await fetch(`/internal/welcome-email/preview?${params.toString()}`);
    const data = await res.json();
    setRawHtml(data.html);
    setMeta(data.meta);
  }, [email]);

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
   * Copy the rendered email into the clipboard as BOTH text/html and
   * text/plain. Pasting into Gmail's compose window picks up the html
   * flavor and drops the fully rendered email in — same as if you'd
   * forwarded it. Chrome + Safari support this natively; Firefox
   * falls back to the html source (still usable, just less polished).
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
      // Firefox / older browsers: fall back to plain text copy of the
      // html so at least SOMETHING lands. User can retry in Chrome.
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
    // Best-effort text version — Gmail uses the html flavor when both
    // are on the clipboard, so this only matters for Firefox / plain-
    // text editors. Not perfect, just readable.
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

  const subject = "Welcome to Testimoni — your Wall of Love is live";

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Welcome email preview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Internal tool. Enter a user&apos;s email — we&apos;ll pull their name,
        workspace, widget, and form from the DB and render the email
        for their account.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              User email
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
                  <span className="font-medium">Name:</span> {meta.recipient.name}
                </p>
                <p>
                  <span className="font-medium">Workspace:</span> {meta.workspaceName}{" "}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ({meta.workspaceSlug})
                  </span>
                </p>
                <p>
                  <span className="font-medium">Widget:</span>{" "}
                  <span className="font-mono text-[10px]">{meta.widgetId}</span>
                </p>
                <p>
                  <span className="font-medium">Form:</span>{" "}
                  <span className="font-mono text-[10px]">{meta.formSlug}</span>
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
              <span className="font-mono">hello@testimoni.io</span>
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
            Rendered email — width fixed at 600px like a real client
          </p>
          <iframe
            key={previewNonce}
            src={previewSrc}
            title="Welcome email preview"
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
