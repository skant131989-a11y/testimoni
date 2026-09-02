"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Archive,
  Trash2,
  Star,
  Pencil,
  X,
  Loader2,
  Check,
  Video,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LetterAvatar } from "@/components/letter-avatar";
import { track } from "@/lib/analytics";
import type { TestimonialStatus, TestimonialSource } from "@prisma/client";

const sourceColors: Record<TestimonialSource, string> = {
  MANUAL: "bg-gray-100 text-gray-700",
  FORM: "bg-blue-100 text-blue-700",
  TWITTER: "bg-sky-100 text-sky-700",
  LINKEDIN: "bg-indigo-100 text-indigo-700",
  GOOGLE: "bg-red-100 text-red-700",
  IMPORT: "bg-purple-100 text-purple-700",
};

export interface TestimonialRowData {
  id: string;
  content: string | null;
  rating: number | null;
  customerName: string;
  customerTitle: string | null;
  customerAvatar: string | null;
  videoUrl: string | null;
  source: TestimonialSource;
  status: TestimonialStatus;
  createdAt: string;
}

export function TestimonialRow({ testimonial }: { testimonial: TestimonialRowData }) {
  const router = useRouter();
  const [t, setT] = useState(testimonial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editContent, setEditContent] = useState(t.content ?? "");
  const [editName, setEditName] = useState(t.customerName);
  const [editTitle, setEditTitle] = useState(t.customerTitle ?? "");
  const [editRating, setEditRating] = useState<number>(t.rating ?? 5);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  // 4-second "Wall updated" flash shown after edit save — subtle
  // reinforcement that the change is now live on the public wall.
  const [wallUpdatedFlash, setWallUpdatedFlash] = useState(false);
  // Optimistic removal — hide the row locally on successful delete so
  // the UI updates without a full page refresh.
  const [removed, setRemoved] = useState(false);
  // Track which side-action is in flight (approve/archive/delete) so
  // we can show a spinner on the right button.
  const [busy, setBusy] = useState<"approve" | "archive" | "delete" | null>(null);

  async function runAction(action: "approve" | "archive" | "delete") {
    if (busy) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/testimonials/${t.id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Couldn't ${action}. Try again.`);
        return;
      }
      if (action === "delete") {
        setRemoved(true);
      } else if (action === "approve") {
        setT((prev) => ({ ...prev, status: "APPROVED" }));
      } else {
        setT((prev) => ({ ...prev, status: "ARCHIVED" }));
      }
      // Refresh so server components (counts, empty states) stay in
      // sync without blocking the optimistic UI update above.
      router.refresh();
    } catch {
      setError(`Couldn't ${action}. Try again.`);
    } finally {
      setBusy(null);
    }
  }

  function startEdit() {
    setEditContent(t.content ?? "");
    setEditName(t.customerName);
    setEditTitle(t.customerTitle ?? "");
    setEditRating(t.rating ?? 5);
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/testimonials/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
          customerName: editName.trim() || t.customerName,
          customerTitle: editTitle.trim() || null,
          rating: editRating,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save. Try again.");
        return;
      }
      const data = await res.json();
      setT({
        ...t,
        content: data.testimonial?.content ?? editContent.trim(),
        customerName: data.testimonial?.customerName ?? editName.trim(),
        customerTitle: data.testimonial?.customerTitle ?? (editTitle.trim() || null),
        rating: data.testimonial?.rating ?? editRating,
      });
      setEditing(false);
      // Flash a "Wall updated" toast so users know their edit is live
      // on the public wall — reinforces the connection between what
      // they change here and what visitors see there. Auto-dismisses.
      setWallUpdatedFlash(true);
      setTimeout(() => setWallUpdatedFlash(false), 4000);
      track("testimonial_edit_saved", { source: "row_edit" });
      router.refresh();
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  /**
   * Video upload — same endpoint as the import page, scoped to this
   * testimonial. Server handles Pro check + old-file cleanup on
   * replace.
   */
  async function uploadVideo(file: File) {
    setVideoUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("testimonialId", t.id);
      const res = await fetch("/api/testimonials/upload-video", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Video upload failed");
        return;
      }
      setT((prev) => ({ ...prev, videoUrl: data.videoUrl }));
      router.refresh();
    } catch {
      setError("Video upload failed");
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  async function removeVideo() {
    if (!confirm("Remove the video from this testimonial?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/testimonials/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not remove video");
        return;
      }
      setT((prev) => ({ ...prev, videoUrl: null }));
      router.refresh();
    } catch {
      setError("Could not remove video");
    }
  }

  // Optimistic delete — remove from DOM without waiting for router.refresh().
  if (removed) return null;

  return (
    <Card className="relative">
      {wallUpdatedFlash && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm animate-in fade-in slide-in-from-top-1">
          ✨ Updated on your wall
        </div>
      )}
      <CardContent className="flex items-start gap-4 p-4">
        {/* Avatar */}
        {t.customerAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.customerAvatar}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <LetterAvatar name={t.customerName} size={40} />
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{t.customerName}</p>
            {t.customerTitle && (
              <span className="text-xs text-muted-foreground">{t.customerTitle}</span>
            )}
            <Badge className={cn("text-xs", sourceColors[t.source])} variant="outline">
              {t.source.toLowerCase()}
            </Badge>
            {t.videoUrl && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Video className="h-3 w-3" />
                Video
              </Badge>
            )}
            <Badge
              variant={
                t.status === "APPROVED"
                  ? "default"
                  : t.status === "PENDING"
                    ? "secondary"
                    : "outline"
              }
            >
              {t.status.toLowerCase()}
            </Badge>
          </div>

          {t.rating && (
            <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < t.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          )}

          {editing ? (
            <div className="mt-3 space-y-3 rounded-lg border bg-muted/30 p-4">
              <div>
                <Label htmlFor={`edit-content-${t.id}`} className="text-xs">
                  Quote
                </Label>
                <Textarea
                  id={`edit-content-${t.id}`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`edit-name-${t.id}`} className="text-xs">
                    Name
                  </Label>
                  <Input
                    id={`edit-name-${t.id}`}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`edit-title-${t.id}`} className="text-xs">
                    Job title / role
                  </Label>
                  <Input
                    id={`edit-title-${t.id}`}
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
                            ? "h-5 w-5 fill-yellow-400 text-yellow-400"
                            : "h-5 w-5 text-muted-foreground/30"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Video attachment — 1 free per workspace, unlimited on
                  Pro. Server enforces the count check and returns 403
                  with upgradeRequired if the quota is exceeded, which
                  the parent import page turns into an upgrade nudge. */}
              <div className="rounded-md border bg-background p-3">
                <Label className="text-xs">Video</Label>
                {t.videoUrl ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <video
                      src={t.videoUrl}
                      controls
                      preload="metadata"
                      className="w-full max-w-xs rounded border bg-black"
                    />
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={videoUploading}
                        onClick={() => videoInputRef.current?.click()}
                      >
                        {videoUploading ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            Replace
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={removeVideo}
                        disabled={videoUploading}
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={videoUploading}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      {videoUploading ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Video className="mr-1.5 h-3.5 w-3.5" />
                          Upload video (MP4, ≤50MB)
                        </>
                      )}
                    </Button>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Pro plan required. Free-plan uploads return an
                      upgrade prompt.
                    </p>
                  </div>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadVideo(file);
                  }}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={saving || !editContent.trim() || !editName.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Save
                    </>
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start">
              {t.videoUrl && (
                <video
                  src={t.videoUrl}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full max-w-[220px] shrink-0 rounded border bg-black"
                />
              )}
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {t.content || (t.videoUrl ? "Video testimonial" : "No text content")}
              </p>
            </div>
          )}
        </div>

        {/* Actions and date */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <time className="text-xs text-muted-foreground">
            {new Date(t.createdAt).toLocaleDateString()}
          </time>
          {!editing && (
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Edit"
                onClick={startEdit}
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
              {t.status !== "APPROVED" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Approve"
                  disabled={busy !== null}
                  onClick={() => runAction("approve")}
                >
                  {busy === "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              )}
              {t.status !== "ARCHIVED" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Archive"
                  disabled={busy !== null}
                  onClick={() => runAction("archive")}
                >
                  {busy === "archive" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Delete"
                disabled={busy !== null}
                onClick={() => runAction("delete")}
              >
                {busy === "delete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
