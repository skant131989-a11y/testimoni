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

  async function handleImport() {
    if (!url.trim()) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/testimonials/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
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
      setImporting(false);
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

        {/* Secondary actions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            variant="ghost"
            onClick={() => {
              setImported(null);
              setUrl("");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add another
          </Button>
          <Button size="lg" onClick={() => router.push("/dashboard")}>
            Continue to dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Empty state — paste URL prompt
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
          Let&apos;s get your first testimonial live in 30 seconds. Paste any
          public tweet or LinkedIn post about your work.
        </p>
      </div>

      {/* Paste input */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
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
            onClick={handleImport}
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

        {error && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Or divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-background px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {/* Share form panel */}
      {defaultFormUrl && (
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">
                📮 Share your collection form
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Send the URL to your last 5 customers, drop it in an email, or
                add it to a follow-up message. Testimonials land in your inbox
                as they come in.
              </p>
            </div>
            <Button
              variant={showFormShare ? "outline" : "default"}
              className="shrink-0"
              onClick={() => setShowFormShare((v) => !v)}
            >
              {showFormShare ? "Hide URL" : "Get share URL"}
            </Button>
          </div>

          {showFormShare && fullFormUrl && (
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

      {/* Escape hatch — for advanced users who just want the dashboard */}
      <div className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="font-medium text-primary hover:underline">
          Skip and explore the dashboard →
        </Link>
      </div>
    </div>
  );
}
