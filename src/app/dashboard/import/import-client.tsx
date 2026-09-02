"use client";

import { useRef, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { track } from "@/lib/analytics";

type Mode = "url" | "manual" | "video";

interface ImportClientProps {
  /** Whether the current workspace is on the Pro plan. Passed in from
   *  the server component so we can render the Pro badge + upfront
   *  upgrade nudge for Free users without an extra client round-trip. */
  isPro: boolean;
}

export default function ImportClient({ isPro }: ImportClientProps) {
  const [mode, setMode] = useState<Mode>("url");
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
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

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
    setImporting(true);
    setError("");
    setSuccess(null);
    setSuccessWidgetId(null);
    track("testimonial_import_started", { source: "url" });
    try {
      const res = await fetch("/api/testimonials/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        track("testimonial_import_failed", { source: "url", status: res.status });
        return;
      }
      const name = data.testimonial?.customerName ?? "the author";
      setSuccess(`Imported testimonial from ${name}. Added to your library.`);
      setSuccessWidgetId(data.widget?.id ?? null);
      setUrl("");
      track("testimonial_created", {
        source: "url",
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
      </div>

      {mode === "url" && (
        <Card>
          <CardHeader>
            <CardTitle>Paste a tweet or LinkedIn post URL</CardTitle>
            <CardDescription>
              We&apos;ll pull the text and author automatically, and drop an approved
              testimonial into your library.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="import-url">Public post URL</Label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="import-url"
                  placeholder="https://x.com/user/status/... or https://linkedin.com/posts/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
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
    </div>
  );
}
