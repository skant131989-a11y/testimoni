"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  Loader2,
  Twitter,
  Linkedin,
  ArrowRight,
  Code,
  Copy,
  Check,
  Video,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { track } from "@/lib/analytics";
import { ImportSourcesRow } from "@/components/import-sources-row";
import { compressImageToDataUrl } from "@/lib/image-compress";
import { SCREENSHOT_TAG } from "@/lib/screenshot-constants";

type Mode = "url" | "manual" | "video" | "screenshot";

interface ImportClientProps {
  /** Whether the current workspace is on the Pro plan. Passed in from
   *  the server component so we can render the Pro badge + upfront
   *  upgrade nudge for Free users without an extra client round-trip. */
  isPro: boolean;
}

export default function ImportClient({ isPro }: ImportClientProps) {
  const searchParams = useSearchParams();
  // Read ?tab= on mount so /dashboard/import?tab=screenshot opens
  // straight to the screenshot flow. Falls back to "url" (default)
  // when the param is missing or invalid.
  const initialMode: Mode = (() => {
    const t = searchParams?.get("tab");
    if (t === "manual" || t === "video" || t === "screenshot" || t === "url") {
      return t;
    }
    return "url";
  })();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [url, setUrl] = useState("");
  const [manualData, setManualData] = useState({
    customerName: "",
    customerEmail: "",
    customerTitle: "",
    content: "",
    rating: 5,
  });
  // Video upload lives in its own state — separate from manual so the
  // user can prep both flows in parallel without stomping on each other.
  const [videoData, setVideoData] = useState({
    customerName: "",
    customerTitle: "",
    content: "",
    rating: 5,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [successWidgetId, setSuccessWidgetId] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Manual-paste fallback state — shown when auto-fetch fails
  // (Reddit blocks, PH parse fails, tweet is deleted, etc.). The
  // URL stays in `url`; text goes into `manualText`, author into
  // `manualAuthor`. Resubmitting POSTs both to the same endpoint,
  // which skips the fetcher and saves what the user pasted.
  const [manualFallback, setManualFallback] = useState(false);
  const [manualText, setManualText] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Screenshot mode — single file for Free plan, multi-file
  // (queued sequentially) for Pro. Pro users see a queue with
  // per-file progress; Free users see the same single-file UX
  // that shipped in v1.
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotExtracting, setScreenshotExtracting] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  // Pro-only queue. Each entry tracks a file's state through the
  // pipeline: queued → compressing → extracting → saved / failed.
  type QueueItem = {
    id: string;
    file: File;
    preview: string | null;
    status: "queued" | "compressing" | "extracting" | "saved" | "failed";
    error?: string;
    author?: string;
  };
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueRunning, setQueueRunning] = useState(false);

  // Same one-line embed used on /dashboard/welcome — script tag with a
  // div anchor. Populated with the successfully-imported testimonial's
  // widget so users can drop it onto their site without hunting.
  const embedOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://testimoni.io";
  const embedSnippet = successWidgetId
    ? `<div id="fw-${successWidgetId}"></div>\n<script src="${embedOrigin}/embed/widget.js" data-widget-id="${successWidgetId}" async></script>`
    : null;

  function copyEmbed() {
    if (!embedSnippet) return;
    navigator.clipboard.writeText(embedSnippet);
    setEmbedCopied(true);
    track("embed_copied", { source: "import_page" });
    setTimeout(() => setEmbedCopied(false), 2000);
  }

  async function handleUrlImport() {
    if (!url.trim()) return;
    // Manual-fallback submit — user pasted text after we couldn't
    // auto-fetch. Guard so an empty textarea doesn't hit the server.
    if (manualFallback && !manualText.trim()) return;
    setImporting(true);
    setError("");
    setSuccess(null);
    setSuccessWidgetId(null);
    track("testimonial_import_started", {
      source: manualFallback ? "url_manual_fallback" : "url",
    });
    try {
      const res = await fetch("/api/testimonials/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          ...(manualFallback && {
            manualText: manualText.trim(),
            manualAuthor: manualAuthor.trim(),
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        // Auto-fetch failed with an inline-recoverable error — reveal
        // the paste-text form so the user can retry without leaving
        // this card. Keeps the URL prefilled.
        if (data.manualFallback) setManualFallback(true);
        track("testimonial_import_failed", { source: "url", status: res.status });
        return;
      }
      const name = data.testimonial?.customerName ?? "the author";
      setSuccess(`Imported testimonial from ${name}. Added to your library.`);
      setSuccessWidgetId(data.widget?.id ?? null);
      setUrl("");
      setManualFallback(false);
      setManualText("");
      setManualAuthor("");
      track("testimonial_created", {
        source: manualFallback ? "url_manual_fallback" : "url",
        platform: data.testimonial?.source ?? null,
        auto_added_to_widget: !!data.widget?.id,
      });
    } catch {
      setError("Something went wrong");
      track("testimonial_import_failed", { source: "url", status: 0 });
    } finally {
      setImporting(false);
    }
  }

  async function handleManualImport() {
    if (!manualData.customerName.trim() || !manualData.content.trim()) return;
    setImporting(true);
    setError("");
    setSuccess(null);
    setSuccessWidgetId(null);
    track("testimonial_import_started", { source: "manual" });
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualData,
          source: "MANUAL",
          status: "APPROVED",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        track("testimonial_import_failed", { source: "manual", status: res.status });
        return;
      }
      setSuccess(`Added testimonial from ${manualData.customerName}.`);
      setSuccessWidgetId(data.widget?.id ?? null);
      setManualData({
        customerName: "",
        customerEmail: "",
        customerTitle: "",
        content: "",
        rating: 5,
      });
      track("testimonial_created", {
        source: "manual",
        auto_added_to_widget: !!data.widget?.id,
      });
    } catch {
      setError("Something went wrong");
      track("testimonial_import_failed", { source: "manual", status: 0 });
    } finally {
      setImporting(false);
    }
  }

  /**
   * Video upload flow: (1) create the testimonial via /api/testimonials
   * so we have an id, then (2) upload the file and attach it. Doing it
   * in this order means a failed upload leaves the testimonial half-
   * created but visible to the user, who can either retry the upload
   * or delete it. The alternative (upload first, then create) means a
   * failed create orphans a file in storage.
   */
  /**
   * Pro-only multi-file screenshot import. Users can drop several
   * screenshots at once; we process them sequentially so we don't
   * blow past Anthropic per-minute rate limits. Each file goes
   * through: compress → extract → save. Status is tracked per row
   * so the UI can show ✓ / ✗ / spinner independently.
   */
  async function handleQueueFiles(files: FileList | File[]) {
    if (!isPro) return; // safety — UI already gates
    const list = Array.from(files);
    if (!list.length) return;
    const items: QueueItem[] = list.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: null,
      status: "queued",
    }));
    setQueue((q) => [...q, ...items]);
    track("testimonial_import_started", {
      source: "screenshot_multi",
      count: items.length,
    });
    if (queueRunning) return; // an existing pass will pick up new items
    runQueue([...queue, ...items]);
  }

  async function runQueue(initial: QueueItem[]) {
    setQueueRunning(true);
    let pending = initial;
    // Loop until every queued/compressing/extracting item is resolved.
    while (pending.some((it) => it.status === "queued")) {
      const nextIdx = pending.findIndex((it) => it.status === "queued");
      if (nextIdx === -1) break;
      const item = pending[nextIdx];
      const setStatus = (
        id: string,
        status: QueueItem["status"],
        extras: Partial<QueueItem> = {},
      ) => {
        setQueue((q) =>
          q.map((it) => (it.id === id ? { ...it, status, ...extras } : it)),
        );
        pending = pending.map((it) =>
          it.id === id ? { ...it, status, ...extras } : it,
        );
      };

      try {
        setStatus(item.id, "compressing");
        const dataUrl = await compressImageToDataUrl(
          item.file,
          4.5 * 1024 * 1024,
        );
        setStatus(item.id, "extracting", { preview: dataUrl });

        const extractRes = await fetch(
          "/api/tools/screenshot-to-testimonial",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl }),
          },
        );
        const extractData = await extractRes.json();
        if (!extractRes.ok || !extractData.is_praise) {
          setStatus(item.id, "failed", {
            error:
              extractData.message ??
              extractData.error ??
              "Extraction failed.",
          });
          continue;
        }
        const saveRes = await fetch("/api/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: extractData.author,
            customerTitle: extractData.author_handle
              ? `@${String(extractData.author_handle).replace(/^@/, "")}`
              : undefined,
            content: extractData.quote,
            rating: 5,
            source: "MANUAL",
            status: "APPROVED",
            tags: [SCREENSHOT_TAG],
          }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) {
          setStatus(item.id, "failed", {
            error: saveData.error ?? "Save failed.",
          });
          continue;
        }
        setStatus(item.id, "saved", { author: extractData.author });
        if (saveData.widget?.id) setSuccessWidgetId(saveData.widget.id);
      } catch {
        setStatus(item.id, "failed", { error: "Network error." });
      }
    }
    setQueueRunning(false);
    // If everything landed clean, surface the standard success + embed
    // reveal so the user gets the same reward as a single-file save.
    const anySaved = pending.some((it) => it.status === "saved");
    if (anySaved) {
      setSuccess(
        `${pending.filter((it) => it.status === "saved").length} testimonial${
          pending.filter((it) => it.status === "saved").length === 1 ? "" : "s"
        } saved!`,
      );
      track("testimonial_import_succeeded", {
        source: "screenshot_multi",
        count: pending.filter((it) => it.status === "saved").length,
      });
    }
  }

  /**
   * Screenshot import — file picked, compressed via Canvas, then
   * sent to /api/tools/screenshot-to-testimonial for Claude Vision
   * extraction. On success we forward the extracted
   * quote+author+source to /api/testimonials to save. Same shape
   * the URL / manual paths use, so the "successWidgetId" flow
   * (embed snippet reveal) works identically after screenshot
   * imports.
   */
  async function handleScreenshotFile(file: File) {
    setError("");
    setSuccess(null);
    if (!file.type.startsWith("image/")) {
      setError("Please pick an image file — PNG, JPEG, WEBP, or GIF.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Image is too large. Please pick one under 15MB.");
      return;
    }
    try {
      const dataUrl = await compressImageToDataUrl(file, 4.5 * 1024 * 1024);
      setScreenshotPreview(dataUrl);
    } catch {
      setError("Couldn't read this image. Try another one.");
    }
  }

  async function handleScreenshotExtract() {
    if (!screenshotPreview) return;
    setScreenshotExtracting(true);
    setImporting(true);
    setError("");
    track("testimonial_import_started", { source: "screenshot" });
    try {
      // Step 1: Claude Vision extraction.
      const extractRes = await fetch(
        "/api/tools/screenshot-to-testimonial",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: screenshotPreview }),
        },
      );
      const extractData = await extractRes.json();
      if (extractRes.status === 402 && extractData.reason === "quota_exceeded") {
        // Free plan monthly cap reached — nudge to Pro. Not
        // rendering a full paywall here so the same tab still
        // shows the URL / manual paths as free alternatives.
        setError(
          `${extractData.message} (Used ${extractData.used}/${extractData.limit} this month.)`,
        );
        setUpgradeRequired(true);
        track("testimonial_import_failed", {
          source: "screenshot",
          status: 402,
          reason: "quota_exceeded",
        });
        return;
      }
      if (extractRes.status === 503) {
        setError(
          extractData.message ??
            "Screenshot extraction is temporarily unavailable.",
        );
        track("testimonial_import_failed", {
          source: "screenshot",
          status: 503,
        });
        return;
      }
      if (!extractRes.ok) {
        setError(extractData.error ?? "Extraction failed.");
        track("testimonial_import_failed", {
          source: "screenshot",
          status: extractRes.status,
        });
        return;
      }
      if (!extractData.is_praise) {
        setError(
          extractData.message ??
            "That doesn't look like praise. Try another screenshot.",
        );
        track("testimonial_import_failed", {
          source: "screenshot",
          status: 0,
          reason: "not_praise",
        });
        return;
      }

      // Step 2: persist the extracted testimonial.
      const saveRes = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: extractData.author,
          customerTitle: extractData.author_handle
            ? `@${String(extractData.author_handle).replace(/^@/, "")}`
            : undefined,
          content: extractData.quote,
          rating: 5,
          source: "MANUAL",
          status: "APPROVED",
          // Tag so the server-side quota check can count this
          // row against the workspace's monthly limit.
          tags: [SCREENSHOT_TAG],
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        setError(saveData.error ?? "Couldn't save the testimonial.");
        return;
      }
      setSuccess("Testimonial extracted and saved!");
      if (saveData.widget?.id) setSuccessWidgetId(saveData.widget.id);
      track("testimonial_import_succeeded", {
        source: "screenshot",
        confidence: extractData.confidence,
        detected_source: extractData.source,
      });
      // Reset the picker so the user can drop another screenshot.
      setScreenshotPreview(null);
      if (screenshotInputRef.current) {
        screenshotInputRef.current.value = "";
      }
    } catch {
      setError("Network error extracting the screenshot. Try again.");
      track("testimonial_import_failed", { source: "screenshot", status: 0 });
    } finally {
      setScreenshotExtracting(false);
      setImporting(false);
    }
  }

  async function handleVideoImport() {
    if (!videoData.customerName.trim() || !videoFile) return;
    setImporting(true);
    setVideoUploading(false);
    setError("");
    setSuccess(null);
    setSuccessWidgetId(null);
    setUpgradeRequired(false);
    try {
      const createRes = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: videoData.customerName,
          customerTitle: videoData.customerTitle || undefined,
          content: videoData.content || undefined,
          rating: videoData.rating,
          source: "MANUAL",
          status: "APPROVED",
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setError(createData.error || "Could not create testimonial");
        return;
      }
      const testimonialId = createData.testimonial?.id;
      if (!testimonialId) {
        setError("Server returned no testimonial id");
        return;
      }
      setSuccessWidgetId(createData.widget?.id ?? null);

      setVideoUploading(true);
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("testimonialId", testimonialId);
      const uploadRes = await fetch("/api/testimonials/upload-video", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        if (uploadData.upgradeRequired) setUpgradeRequired(true);
        setError(uploadData.error || "Video upload failed");
        track("video_upload_failed", {
          status: uploadRes.status,
          reason: uploadData.upgradeRequired
            ? "upgrade_required"
            : uploadRes.status === 413
              ? "too_large"
              : uploadRes.status === 415
                ? "bad_format"
                : "other",
          size_mb: videoFile ? +(videoFile.size / 1024 / 1024).toFixed(1) : null,
        });
        return;
      }

      setSuccess(`Video testimonial from ${videoData.customerName} added.`);
      setVideoData({
        customerName: "",
        customerTitle: "",
        content: "",
        rating: 5,
      });
      setVideoFile(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      track("video_testimonial_uploaded", { source: "import_page" });
      // Also fire the canonical testimonial_created event so this
      // path shows up in the same top-level "how did they add
      // testimonials" funnel as URL + manual imports.
      track("testimonial_created", {
        source: "video",
        auto_added_to_widget: !!successWidgetId,
      });
    } catch {
      setError("Something went wrong");
    } finally {
      setImporting(false);
      setVideoUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Testimonials</h1>
        <p className="text-muted-foreground">
          Turn public praise from X or LinkedIn into an approved testimonial,
          or add one manually.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === "url" ? "default" : "outline"}
          onClick={() => {
            setMode("url");
            setError("");
            setSuccess(null);
            track("import_tab_selected", { tab: "url" });
          }}
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Paste URL
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => {
            setMode("manual");
            setError("");
            setSuccess(null);
            track("import_tab_selected", { tab: "manual" });
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Manual entry
        </Button>
        <Button
          variant={mode === "screenshot" ? "default" : "outline"}
          onClick={() => {
            setMode("screenshot");
            setError("");
            setSuccess(null);
            track("import_tab_selected", { tab: "screenshot" });
          }}
          className="relative"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Screenshot
          <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            AI
          </span>
        </Button>
        <Button
          variant={mode === "video" ? "default" : "outline"}
          onClick={() => {
            setMode("video");
            setError("");
            setSuccess(null);
            setUpgradeRequired(false);
            track("import_tab_selected", { tab: "video", is_pro: isPro });
          }}
          className="relative"
        >
          <Video className="mr-2 h-4 w-4" />
          Upload video
          {!isPro && (
            <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              1 free
            </span>
          )}
        </Button>
        {/* Review sources tab — this one's a plain Link that
            navigates AWAY to /dashboard/sources. Sources is a
            list-management view (connected platforms, sync status,
            per-source settings) that doesn't fit inline as a mode.
            The tab exists here purely for discoverability — users
            think "add testimonials → Import", so this signposts
            the path from that mental model. Small arrow icon
            signals "opens somewhere else." */}
        <Button variant="outline" asChild className="relative">
          <Link
            href="/dashboard/sources"
            onClick={() => track("import_tab_selected", { tab: "sources" })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Import from sources
            <ExternalLink className="ml-2 h-3 w-3 text-muted-foreground" />
            <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Pro · New
            </span>
          </Link>
        </Button>
      </div>

      {mode === "url" && (
        <Card>
          <CardHeader>
            <CardTitle>Paste a URL from any supported platform</CardTitle>
            <CardDescription>
              We&apos;ll pull the text and author automatically, and drop an approved
              testimonial into your library.
            </CardDescription>
            <ImportSourcesRow label="Supports" className="mt-3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="import-url">Public post URL</Label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="import-url"
                  placeholder="X · LinkedIn · Reddit · Hacker News · Product Hunt"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    // A fresh URL cancels the fallback state so we
                    // re-try auto-fetch instead of blindly reusing
                    // the last pasted text.
                    if (manualFallback) {
                      setManualFallback(false);
                      setManualText("");
                      setManualAuthor("");
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlImport()}
                />
                <Button
                  onClick={handleUrlImport}
                  disabled={importing || !url.trim()}
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Twitter className="h-3.5 w-3.5" /> X / Twitter
                </span>
                <span className="inline-flex items-center gap-1">
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </span>
                <span>
                  Post must be public. Deleted or private posts can&apos;t be read.
                </span>
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Inline manual-paste fallback — reveals a small form
                under the URL input the moment auto-fetch fails
                recoverably (Reddit block, PH parse fail, deleted
                tweet). User pastes the text + optional author and
                re-submits without leaving this card. sourceUrl stays
                what they originally pasted so the wall card still
                links back with "read full →". */}
            {manualFallback && (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                <div className="mb-3 flex items-start gap-2 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-foreground">
                    Paste the quote text below — we&apos;ll save it
                    with the source URL you pasted above.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="manual-text" className="text-xs">
                      The quote *
                    </Label>
                    <Textarea
                      id="manual-text"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Paste the comment or post text here…"
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-author" className="text-xs">
                      Author name{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="manual-author"
                      value={manualAuthor}
                      onChange={(e) => setManualAuthor(e.target.value)}
                      placeholder="e.g. u/theirusername"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleUrlImport}
                    disabled={importing || !manualText.trim()}
                    className="w-full gap-2"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>Save testimonial</>
                    )}
                  </Button>
                </div>
              </div>
            )}
            {success && (
              <>
                <div className="flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    {success}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/dashboard/testimonials">
                        See it <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    {successWidgetId && (
                      <Button asChild size="sm">
                        <Link href={`/w/${successWidgetId}`} target="_blank" rel="noopener noreferrer">
                          Go to Wall <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                    {embedSnippet && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const next = !embedOpen;
                          setEmbedOpen(next);
                          if (next) track("embed_opened", { source: "import_page" });
                        }}
                      >
                        <Code className="mr-1 h-3 w-3" />
                        {embedOpen ? "Hide embed" : "Copy embed"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Collapsible embed snippet — mirrors welcome page card but
                    much lighter since import-page users are past onboarding. */}
                {embedOpen && embedSnippet && (
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Paste this on your site (Framer, Webflow, WordPress, React, HTML):
                    </p>
                    <pre className="mt-2 overflow-x-auto rounded border bg-background p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
                      <code>{embedSnippet}</code>
                    </pre>
                    <div className="mt-2 flex flex-wrap gap-2">
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
                            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy code
                          </>
                        )}
                      </Button>
                      {successWidgetId && (
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/dashboard/widgets/${successWidgetId}/embed`}>
                            More embed options →
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
      {mode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle>Add a testimonial manually</CardTitle>
            <CardDescription>
              Paste in a testimonial you already collected via email, DM, or
              somewhere else.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Customer name *</Label>
                <Input
                  id="name"
                  value={manualData.customerName}
                  onChange={(e) =>
                    setManualData({ ...manualData, customerName: e.target.value })
                  }
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={manualData.customerEmail}
                  onChange={(e) =>
                    setManualData({ ...manualData, customerEmail: e.target.value })
                  }
                  placeholder="jane@company.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title / Company</Label>
              <Input
                id="title"
                value={manualData.customerTitle}
                onChange={(e) =>
                  setManualData({ ...manualData, customerTitle: e.target.value })
                }
                placeholder="CEO at Acme Inc"
              />
            </div>

            <div>
              <Label htmlFor="content">Testimonial *</Label>
              <Textarea
                id="content"
                value={manualData.content}
                onChange={(e) =>
                  setManualData({ ...manualData, content: e.target.value })
                }
                placeholder="Their testimonial goes here…"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="rating">Rating (1–5)</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={manualData.rating}
                onChange={(e) =>
                  setManualData({
                    ...manualData,
                    rating: parseInt(e.target.value) || 5,
                  })
                }
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <>
                <div className="flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    {success}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/dashboard/testimonials">
                        See it <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    {successWidgetId && (
                      <Button asChild size="sm">
                        <Link href={`/w/${successWidgetId}`} target="_blank" rel="noopener noreferrer">
                          Go to Wall <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                    {embedSnippet && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const next = !embedOpen;
                          setEmbedOpen(next);
                          if (next) track("embed_opened", { source: "import_page" });
                        }}
                      >
                        <Code className="mr-1 h-3 w-3" />
                        {embedOpen ? "Hide embed" : "Copy embed"}
                      </Button>
                    )}
                  </div>
                </div>

                {embedOpen && embedSnippet && (
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Paste this on your site (Framer, Webflow, WordPress, React, HTML):
                    </p>
                    <pre className="mt-2 overflow-x-auto rounded border bg-background p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
                      <code>{embedSnippet}</code>
                    </pre>
                    <div className="mt-2 flex flex-wrap gap-2">
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
                            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy code
                          </>
                        )}
                      </Button>
                      {successWidgetId && (
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/dashboard/widgets/${successWidgetId}/embed`}>
                            More embed options →
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <Button
              onClick={handleManualImport}
              disabled={
                importing || !manualData.customerName || !manualData.content
              }
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Add testimonial
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
      {mode === "video" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload a video testimonial</CardTitle>
            <CardDescription>
              Attach an MP4 or MOV (up to 50MB). Free plan includes 1 video;
              Pro is unlimited.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upgrade nudge only shows AFTER a real quota failure
                now — Free users can attempt the first upload without
                any gating message. Second attempt hits the server
                cap and we show the "you've used your free video"
                variant. Pro users never see this. */}
            {upgradeRequired && (
              <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-primary">
                  You&apos;ve used your free video.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Delete the existing one to upload a different clip, or
                  upgrade to Pro for unlimited video testimonials.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link
                    href="/dashboard/settings/billing"
                    onClick={() =>
                      track("video_upgrade_nudge_click", {
                        source: "video_tab",
                        seen: "after_submit",
                      })
                    }
                  >
                    Upgrade to Pro <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}

            <div>
              <Label htmlFor="video-file">Video file *</Label>
              <Input
                ref={videoInputRef}
                id="video-file"
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setVideoFile(file);
                  if (file) {
                    track("video_file_selected", {
                      size_mb: +(file.size / 1024 / 1024).toFixed(1),
                      type: file.type,
                      is_pro: isPro,
                    });
                  }
                }}
                className="mt-1"
              />
              {videoFile && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {videoFile.name} — {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                MP4 or MOV, up to 50MB.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="video-name">Customer name *</Label>
                <Input
                  id="video-name"
                  value={videoData.customerName}
                  onChange={(e) =>
                    setVideoData({ ...videoData, customerName: e.target.value })
                  }
                  placeholder="Jane Smith"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="video-title">Title / Company</Label>
                <Input
                  id="video-title"
                  value={videoData.customerTitle}
                  onChange={(e) =>
                    setVideoData({ ...videoData, customerTitle: e.target.value })
                  }
                  placeholder="CEO at Acme"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="video-content">Written summary (optional)</Label>
              <Textarea
                id="video-content"
                value={videoData.content}
                onChange={(e) =>
                  setVideoData({ ...videoData, content: e.target.value })
                }
                placeholder="One-line summary shown when the video is loading or muted."
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="video-rating">Rating (1–5)</Label>
              <Input
                id="video-rating"
                type="number"
                min={1}
                max={5}
                value={videoData.rating}
                onChange={(e) =>
                  setVideoData({
                    ...videoData,
                    rating: parseInt(e.target.value) || 5,
                  })
                }
                className="mt-1"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <div className="flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/dashboard/testimonials">
                      See it <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                  {successWidgetId && (
                    <Button asChild size="sm">
                      <Link
                        href={`/w/${successWidgetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Go to Wall <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleVideoImport}
              disabled={
                importing ||
                !videoFile ||
                !videoData.customerName.trim()
              }
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {videoUploading ? "Uploading video…" : "Creating…"}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload testimonial
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === "screenshot" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Extract from a screenshot
              {isPro ? (
                <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Pro · Unlimited · Multi-file
                </span>
              ) : (
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Free · 3 total
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Drop {isPro ? "one or many" : "a"} screenshot{isPro ? "s" : ""} of
              praise — DM, tweet, Slack, WhatsApp, email, App Store review.
              We&apos;ll extract the quote, author, and source in 3-6 seconds
              per file and save it as a testimonial.
              {!isPro && (
                <>
                  {" "}
                  Free plan includes 3 total screenshot extractions.{" "}
                  <Link
                    href="/pricing"
                    className="font-medium text-primary hover:underline"
                  >
                    Upgrade for unlimited + multi-file upload →
                  </Link>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Pro path: multi-file queue */}
            {isPro ? (
              <div className="space-y-4">
                <label
                  htmlFor="dashboard-screenshot-multi"
                  className="block cursor-pointer rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/10"
                >
                  <input
                    id="dashboard-screenshot-multi"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length) handleQueueFiles(files);
                      // Reset so re-picking the same files re-fires.
                      e.currentTarget.value = "";
                    }}
                  />
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-3 text-base font-semibold">
                    Drop multiple screenshots or click to pick
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Files process sequentially — you can add more while
                    others are extracting.
                  </p>
                </label>

                {queue.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Queue ({queue.filter((it) => it.status === "saved").length}
                      /{queue.length} saved)
                    </p>
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                          {item.preview && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.preview}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.file.name}
                          </p>
                          {item.status === "saved" && item.author && (
                            <p className="text-xs text-emerald-700">
                              Extracted from {item.author}
                            </p>
                          )}
                          {item.status === "failed" && item.error && (
                            <p className="text-xs text-destructive">
                              {item.error}
                            </p>
                          )}
                          {(item.status === "queued" ||
                            item.status === "compressing" ||
                            item.status === "extracting") && (
                            <p className="text-xs text-muted-foreground">
                              {item.status === "queued"
                                ? "Queued…"
                                : item.status === "compressing"
                                  ? "Compressing…"
                                  : "Extracting…"}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {item.status === "saved" && (
                            <Check className="h-5 w-5 text-emerald-600" />
                          )}
                          {item.status === "failed" && (
                            <span className="text-lg text-destructive">✕</span>
                          )}
                          {(item.status === "queued" ||
                            item.status === "compressing" ||
                            item.status === "extracting") && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : !screenshotPreview ? (
              /* Free path: single-file picker */
              <label
                htmlFor="dashboard-screenshot-file"
                className="block cursor-pointer rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/10"
              >
                <input
                  ref={screenshotInputRef}
                  id="dashboard-screenshot-file"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScreenshotFile(file);
                  }}
                />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 text-base font-semibold">
                  Drop your screenshot or click to pick
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPEG, WEBP, or GIF · up to 15MB · one at a time on Free
                </p>
              </label>
            ) : (
              /* Free path: preview + extract */
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1 overflow-hidden rounded-xl border bg-background shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotPreview}
                      alt="Your screenshot"
                      className="max-h-64 w-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleScreenshotExtract}
                    disabled={screenshotExtracting}
                    size="lg"
                    className="gap-2"
                  >
                    {screenshotExtracting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extracting…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Extract & save to wall
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScreenshotPreview(null);
                      if (screenshotInputRef.current) {
                        screenshotInputRef.current.value = "";
                      }
                    }}
                    disabled={screenshotExtracting}
                  >
                    Pick a different one
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  We compress your image locally before extraction — it
                  never leaves your device until you click Extract.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
