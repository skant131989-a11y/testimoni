"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Sparkles,
  Star,
  ArrowRight,
  ExternalLink,
  Twitter,
  Linkedin,
  Plus,
  Copy,
  Check,
  Pencil,
  X,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LetterAvatar } from "@/components/letter-avatar";
import { track, identify } from "@/lib/analytics";

interface ImportedTestimonial {
  id: string;
  content: string;
  customerName: string;
  customerTitle: string | null;
  rating: number | null;
  source: string;
  sourceUrl: string | null;
}

interface WelcomeClientProps {
  defaultWidgetId: string | null;
  defaultFormUrl: string | null;
  workspaceName: string;
  isNewSignup: boolean;
  signupMethod: "google" | "email";
  userId: string | null;
  userEmail: string | null;
}

export function WelcomeClient({
  defaultWidgetId,
  defaultFormUrl,
  workspaceName,
  isNewSignup,
  signupMethod,
  userId,
  userEmail,
}: WelcomeClientProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<ImportedTestimonial | null>(null);
  const [importedWidgetId, setImportedWidgetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editRating, setEditRating] = useState<number>(5);
  const [showFormShare, setShowFormShare] = useState(false);
  const [formCopied, setFormCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  // Intake mode — "url" is the primary path, "manual" reveals when the
  // user clicks the "no tweet handy" toggle. Same card, different input.
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [manualName, setManualName] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualRating, setManualRating] = useState<number>(5);
  const [savingManual, setSavingManual] = useState(false);

  // Fire signup_completed exactly once for fresh signups (< 90s old).
  // Google OAuth users can't be tracked from the button click alone
  // because the browser redirects away before capture flushes; instead
  // we catch them when they land back on this welcome page. Guard with
  // a ref so React StrictMode / re-renders don't double-fire.
  const completionFiredRef = useRef(false);
  useEffect(() => {
    if (!isNewSignup || completionFiredRef.current) return;
    completionFiredRef.current = true;
    if (userId) identify(userId, { email: userEmail ?? undefined });
    track("signup_completed", { method: signupMethod, source: "welcome_landing" });
  }, [isNewSignup, signupMethod, userId, userEmail]);

  // Auto-import a URL the user pasted on the homepage demo before
  // signing up. sessionStorage survives the auth redirect (same tab).
  // If a preview payload is also stashed we render the imported card
  // instantly (skipping the "Importing..." loader flash) and persist
  // to the DB in the background.
  const autoImportRef = useRef(false);
  useEffect(() => {
    if (autoImportRef.current) return;
    let pending: string | null = null;
    let previewJson: string | null = null;
    try {
      pending = sessionStorage.getItem("pending_import_url");
      previewJson = sessionStorage.getItem("pending_import_preview");
    } catch {}
    if (!pending) return;
    autoImportRef.current = true;
    try {
      sessionStorage.removeItem("pending_import_url");
      sessionStorage.removeItem("pending_import_preview");
    } catch {}
    setUrl(pending);
    track("auto_import_from_demo", { source: "welcome_landing" });

    // Optimistic render — use the stashed preview so the user sees
    // "your testimonial is live" immediately, without watching a
    // second loader after the one on the landing page.
    if (previewJson) {
      try {
        const preview = JSON.parse(previewJson) as {
          content: string;
          customerName: string;
          customerTitle?: string | null;
          source: string;
          sourceUrl: string;
        };
        setImported({
          // Provisional id — replaced with the real DB id once persist
          // completes. Edit is disabled until then via the check on
          // imported.id below (added in startEdit).
          id: "pending",
          content: preview.content,
          customerName: preview.customerName,
          customerTitle: preview.customerTitle ?? null,
          rating: 5,
          source: preview.source,
          sourceUrl: preview.sourceUrl,
        });
        if (defaultWidgetId) setImportedWidgetId(defaultWidgetId);
      } catch {}
    }

    // Persist in the background. Pass the URL directly so we don't
    // race React's re-render after setUrl above — see handleImport.
    const hadPreview = !!previewJson;
    setTimeout(() => {
      handleImportRef.current?.({ silent: hadPreview, urlOverride: pending! });
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handleImport is defined below with closures over state; keep a
  // ref so the auto-import effect (which must run once on mount)
  // can call the latest version.
  const handleImportRef = useRef<((opts?: { silent?: boolean; urlOverride?: string }) => void) | null>(null);

  const fullFormUrl =
    typeof window !== "undefined" && defaultFormUrl
      ? `${window.location.origin}${defaultFormUrl}`
      : defaultFormUrl;

  // Fall back to the id passed in from the server if the API response
  // doesn't carry one for any reason.
  const effectiveWidgetId = importedWidgetId ?? defaultWidgetId;
  const wallUrl =
    typeof window !== "undefined" && effectiveWidgetId
      ? `${window.location.origin}/w/${effectiveWidgetId}`
      : effectiveWidgetId
        ? `/w/${effectiveWidgetId}`
        : null;

  // One-line embed snippet for the default widget. Ships the same shape
  // as the dashboard's Embed page (div anchor + async script) — swapping
  // in later is a copy-paste. Kept as a single string so we can pass it
  // straight to clipboard.
  const embedOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://testimoni.io";
  const embedSnippet = effectiveWidgetId
    ? `<div id="fw-${effectiveWidgetId}"></div>\n<script src="${embedOrigin}/embed/widget.js" data-widget-id="${effectiveWidgetId}" async></script>`
    : null;

  async function handleImport(opts?: { silent?: boolean; urlOverride?: string }) {
    // Accept an explicit urlOverride so callers that just set the URL
    // state don't have to wait for React's re-render before firing the
    // import. Without this, the auto-import effect races the render
    // and reads a stale empty `url` from the closure — the persist
    // then bails on the trim() guard and the testimonial never lands
    // in the DB (only in the optimistic UI).
    const target = (opts?.urlOverride ?? url).trim();
    if (!target) return;
    if (!opts?.silent) setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/testimonials/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't import that URL. Try another one.");
        return;
      }
      setImported(data.testimonial);
      if (data.widget?.id) {
        setImportedWidgetId(data.widget.id);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      if (!opts?.silent) setImporting(false);
    }
  }

  // Keep handleImportRef in sync so the mount-only auto-import effect
  // can call the latest version without re-firing on every render.
  handleImportRef.current = handleImport;

  async function handleManualSubmit() {
    if (!manualName.trim() || !manualContent.trim()) return;
    setSavingManual(true);
    setError(null);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: manualName.trim(),
          customerTitle: manualTitle.trim() || undefined,
          content: manualContent.trim(),
          rating: manualRating,
          source: "MANUAL",
          status: "APPROVED",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't save. Try again.");
        return;
      }
      // Reuse the same imported state so the success screen renders
      // identically whether the user came in via URL or manual entry.
      setImported({
        id: data.testimonial.id,
        content: data.testimonial.content,
        customerName: data.testimonial.customerName,
        customerTitle: data.testimonial.customerTitle,
        rating: data.testimonial.rating,
        source: data.testimonial.source ?? "MANUAL",
        sourceUrl: null,
      });
      if (data.widget?.id) setImportedWidgetId(data.widget.id);
      track("welcome_manual_saved", { source: "welcome_landing" });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSavingManual(false);
    }
  }

  function copyWall() {
    if (!wallUrl) return;
    navigator.clipboard.writeText(wallUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyForm() {
    if (!fullFormUrl) return;
    navigator.clipboard.writeText(fullFormUrl);
    setFormCopied(true);
    setTimeout(() => setFormCopied(false), 2000);
  }

  function copyEmbed() {
    if (!embedSnippet) return;
    navigator.clipboard.writeText(embedSnippet);
    setEmbedCopied(true);
    track("welcome_embed_copied", { source: "welcome_landing" });
    setTimeout(() => setEmbedCopied(false), 2000);
  }

  function startEdit() {
    if (!imported) return;
    setEditContent(imported.content);
    setEditName(imported.customerName);
    setEditTitle(imported.customerTitle ?? "");
    setEditRating(imported.rating ?? 5);
    setEditing(true);
  }

  async function saveEdit() {
    if (!imported) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/testimonials/${imported.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
          customerName: editName.trim() || imported.customerName,
          customerTitle: editTitle.trim() || null,
          rating: editRating,
        }),
      });
      if (!res.ok) {
        setError("Could not save edits. Try again.");
        return;
      }
      const data = await res.json();
      setImported({
        ...imported,
        content: data.testimonial?.content ?? editContent.trim(),
        customerName: data.testimonial?.customerName ?? editName.trim(),
        customerTitle: data.testimonial?.customerTitle ?? (editTitle.trim() || null),
        rating: data.testimonial?.rating ?? editRating,
      });
      setEditing(false);
    } catch {
      setError("Could not save edits. Try again.");
    } finally {
      setSaving(false);
    }
  }

  // Success state — imported testimonial + wall preview
  if (imported) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
            Your first testimonial is live 🎉
          </h1>
          <p className="mt-3 text-muted-foreground">
            We pulled it from the URL and added it to your wall. That&apos;s the
            whole loop — collect, approve, live.
          </p>
        </div>

        {/* Imported card preview */}
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              On your Wall of Love now:
            </p>
            {!editing && (
              <Button size="sm" variant="ghost" onClick={startEdit} className="h-7 px-2 text-xs">
                <Pencil className="mr-1 h-3 w-3" /> Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3 rounded-xl border bg-background p-5">
              <div>
                <Label htmlFor="edit-content" className="text-xs">Quote</Label>
                <Textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-name" className="text-xs">Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-title" className="text-xs">Job title / role</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g. CEO at Acme"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Rating</Label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditRating(n)}
                      className="p-1"
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    >
                      <Star
                        className={
                          n <= editRating
                            ? "h-6 w-6 fill-yellow-400 text-yellow-400"
                            : "h-6 w-6 text-muted-foreground/30"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} disabled={saving || !editContent.trim() || !editName.trim()}>
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Check className="mr-2 h-4 w-4" /> Save</>
                  )}
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-background p-5">
              {imported.rating && (
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < (imported.rating ?? 0)
                          ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                          : "h-4 w-4 fill-muted text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
              )}
              <p className="text-sm leading-relaxed">
                &ldquo;{imported.content}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <LetterAvatar name={imported.customerName} size={36} />
                <div>
                  <p className="text-sm font-bold">{imported.customerName}</p>
                  {imported.customerTitle && (
                    <p className="text-xs text-muted-foreground">{imported.customerTitle}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prominent Wall URL — the shareable link they can drop in
            Instagram bios, email signatures, WhatsApp, etc. */}
        {wallUrl && (
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold">
              Your live Wall of Love URL
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Share this anywhere — Instagram bio, email signature, DMs, QR
              codes on print. Anyone can view it, no signup needed.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <div className="min-w-0 flex-1 truncate rounded-md border bg-muted/60 px-3 py-2 font-mono text-xs text-foreground">
                {wallUrl}
              </div>
              <Button
                onClick={copyWall}
                variant={copied ? "default" : "outline"}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" /> Copy link
                  </>
                )}
              </Button>
              <Button asChild variant="outline" className="shrink-0">
                <a href={wallUrl} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* One-line embed — for users who want the widget on their site
            today. Deliberately ONE snippet, no picker; the full embed
            page (script/iframe/React variants) lives in the dashboard. */}
        {embedSnippet && (
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Code className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Or embed it on your site
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Paste this on any page — Framer, Webflow, WordPress, React,
                  vanilla HTML. Your wall stays in sync as you approve more.
                </p>
                <pre className="mt-3 overflow-x-auto rounded-md border bg-muted/60 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                  <code>{embedSnippet}</code>
                </pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={copyEmbed}
                    variant={embedCopied ? "default" : "outline"}
                  >
                    {embedCopied ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy embed code
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/widgets/${effectiveWidgetId}/embed`)}
                  >
                    More embed options →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Secondary actions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            variant="ghost"
            onClick={() => {
              setImported(null);
              setUrl("");
              setMode("url");
              setManualName("");
              setManualContent("");
              setManualTitle("");
              setManualRating(5);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add another
          </Button>
          <Button size="lg" onClick={() => router.push("/dashboard")}>
            Continue to dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Curiosity link — only shown after activation, when "what could
            this look like" is the right emotion. Not on the empty state,
            where it would pull attention from the primary action. */}
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/w/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
            onClick={() =>
              track("welcome_view_sample_wall", { source: "welcome_landing" })
            }
          >
            See what a full Wall of Love looks like →
          </Link>
        </p>
      </div>
    );
  }

  // Empty state — one primary action, one small fallback link, one
  // collapsed secondary. No parallel choices, no "skip" escape hatch.
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
          Welcome to {workspaceName || "Testimoni"} 👋
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg text-muted-foreground">
          {mode === "url"
            ? "Let's get your first testimonial live in 30 seconds. Paste any public tweet or LinkedIn post about your work."
            : "Type in a testimonial you already have — from an email, a DM, or a screenshot."}
        </p>
      </div>

      {/* Primary card — URL input or manual form depending on mode */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
        {mode === "url" ? (
          <>
            <label htmlFor="import-url" className="text-sm font-semibold">
              Public tweet or LinkedIn post URL
            </label>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                id="import-url"
                placeholder="https://x.com/user/status/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
                className="text-base"
              />
              <Button
                onClick={() => handleImport()}
                disabled={importing || !url.trim()}
                size="lg"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…
                  </>
                ) : (
                  <>
                    Import <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Twitter className="h-3.5 w-3.5" /> X / Twitter
              </span>
              <span className="inline-flex items-center gap-1">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </span>
              <span>Post must be public and not deleted.</span>
            </p>

            {/* Mode toggle — one tap to switch to manual entry */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("manual");
                track("welcome_switched_to_manual", { source: "welcome_landing" });
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Don&apos;t have a tweet handy? Type one in manually →
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <label htmlFor="m-content" className="text-sm font-semibold">
                Type in a testimonial you already have
              </label>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("url");
                }}
                className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                ← Back to URL paste
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="m-content" className="text-xs">Their words *</Label>
                <Textarea
                  id="m-content"
                  placeholder={`"Set up my testimonials wall in about 5 minutes. Wild."`}
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="m-name" className="text-xs">Their name *</Label>
                  <Input
                    id="m-name"
                    placeholder="Jane Smith"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="m-title" className="text-xs">Title / role</Label>
                  <Input
                    id="m-title"
                    placeholder="CEO at Acme"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Rating</Label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setManualRating(n)}
                      className="p-1"
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    >
                      <Star
                        className={
                          n <= manualRating
                            ? "h-6 w-6 fill-yellow-400 text-yellow-400"
                            : "h-6 w-6 text-muted-foreground/30"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleManualSubmit}
                disabled={savingManual || !manualName.trim() || !manualContent.trim()}
                size="lg"
                className="w-full"
              >
                {savingManual ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Add to my Wall <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Secondary — share collection form. Collapsed by default; one
          click reveals the URL. Kept as an "also" so users with zero
          content still have a path forward. */}
      {defaultFormUrl && (
        <div className="text-center">
          {!showFormShare ? (
            <button
              type="button"
              onClick={() => {
                setShowFormShare(true);
                track("welcome_form_share_opened", { source: "welcome_landing" });
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Also — share a collection form with customers →
            </button>
          ) : (
            <div className="rounded-2xl border bg-card p-5 text-left">
              <p className="text-sm font-semibold">📮 Share your collection form</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Send this URL to your last 5 customers, drop it in an email,
                or add it to a follow-up message. Submissions land in your
                inbox as they come in.
              </p>
              {fullFormUrl && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <div className="min-w-0 flex-1 truncate rounded-md border bg-muted/60 px-3 py-2 font-mono text-xs">
                    {fullFormUrl}
                  </div>
                  <Button
                    onClick={copyForm}
                    variant={formCopied ? "default" : "outline"}
                    className="shrink-0"
                  >
                    {formCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" /> Copy link
                      </>
                    )}
                  </Button>
                  <Button asChild variant="outline" className="shrink-0">
                    <a href={fullFormUrl} target="_blank" rel="noopener noreferrer">
                      Preview <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
