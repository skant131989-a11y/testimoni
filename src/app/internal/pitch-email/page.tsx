"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface PreviewMeta {
  subject: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  audience: "founder" | "sales" | "marketing";
}

/**
 * Internal outreach-pitch preview. Pick an audience variant, fill in
 * the recipient's first name (and optional company), and get a
 * personal-note email you can paste straight into Gmail.
 *
 * NOT linked from nav — gate behind auth before opening broadly.
 */
export default function PitchEmailPreviewPage() {
  const [audience, setAudience] = useState<"founder" | "sales" | "marketing">(
    "founder",
  );
  const [recipientName, setRecipientName] = useState("Alex");
  const [companyName, setCompanyName] = useState("");
  const [praiseTweetUrl, setPraiseTweetUrl] = useState("");
  const [senderName, setSenderName] = useState("Neha Singh");
  const [senderEmail, setSenderEmail] = useState("neha@testimoni.io");
  const [previewNonce, setPreviewNonce] = useState(0);
  const [rawOpen, setRawOpen] = useState(false);
  const [rawHtml, setRawHtml] = useState("");
  const [meta, setMeta] = useState<PreviewMeta | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [copyRichOk, setCopyRichOk] = useState(false);

  const previewSrc = useMemo(() => {
    const params = new URLSearchParams({
      audience,
      recipientName,
      companyName,
      praiseTweetUrl,
      senderName,
      senderEmail,
      _: String(previewNonce),
    });
    return `/internal/pitch-email/preview?${params.toString()}`;
  }, [
    audience,
    recipientName,
    companyName,
    praiseTweetUrl,
    senderName,
    senderEmail,
    previewNonce,
  ]);

  const fetchMeta = useCallback(async () => {
    const params = new URLSearchParams({
      audience,
      recipientName,
      companyName,
      praiseTweetUrl,
      senderName,
      senderEmail,
      json: "1",
    });
    const res = await fetch(`/internal/pitch-email/preview?${params.toString()}`);
    const data = await res.json();
    setRawHtml(data.html);
    setMeta(data.meta);
  }, [audience, recipientName, companyName, praiseTweetUrl, senderName, senderEmail]);

  useEffect(() => {
    fetchMeta();
  }, [previewNonce, fetchMeta]);

  async function copyHtml() {
    if (!rawHtml) await fetchMeta();
    await navigator.clipboard.writeText(rawHtml);
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 2000);
  }

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

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Pitch email preview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Personal-note email you can paste into Gmail to introduce Testimoni to a
        specific founder, sales, or marketing lead.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Audience variant
            </label>
            <div className="mt-1 grid grid-cols-3 gap-1 rounded-md border p-1">
              {(["founder", "sales", "marketing"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={`rounded px-2 py-1.5 text-xs font-medium capitalize ${
                    audience === a
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Recipient first name
            </label>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Alex"
              className="mt-1 w-full rounded border px-2.5 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Company (optional)
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme"
              className="mt-1 w-full rounded border px-2.5 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Praise tweet URL (optional)
            </label>
            <input
              value={praiseTweetUrl}
              onChange={(e) => setPraiseTweetUrl(e.target.value)}
              placeholder="https://x.com/…"
              className="mt-1 w-full rounded border px-2.5 py-1.5 text-sm font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Include if you want to nudge them to try it with a real tweet.
            </p>
          </div>

          <div className="border-t pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Send from
            </p>
            <div className="mt-2">
              <label className="text-xs font-medium text-muted-foreground">
                Your name
              </label>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="mt-1 w-full rounded border px-2.5 py-1.5 text-sm"
              />
            </div>
            <div className="mt-2">
              <label className="text-xs font-medium text-muted-foreground">
                Your email
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
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

          <div className="mt-3 rounded border border-dashed p-3 text-xs">
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
              Send envelope
            </p>
            <p className="mt-2">
              <strong className="font-medium">From:</strong>{" "}
              <span className="font-mono">
                {senderName} &lt;{senderEmail}&gt;
              </span>
            </p>
            <p className="mt-1">
              <strong className="font-medium">Reply-to:</strong>{" "}
              <span className="font-mono">{senderEmail}</span>
            </p>
            <p className="mt-1">
              <strong className="font-medium">To:</strong>{" "}
              <span className="font-mono">(their email)</span>
            </p>
            <p className="mt-1">
              <strong className="font-medium">Subject:</strong>{" "}
              {meta?.subject ?? "(loading)"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Rendered email — 560px width, personal-note style
          </p>
          <iframe
            key={previewNonce}
            src={previewSrc}
            title="Pitch email preview"
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
