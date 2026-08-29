"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LetterAvatar } from "@/components/letter-avatar";
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
      router.refresh();
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
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
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
              {t.content || "No text content"}
            </p>
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
                <form action={`/api/testimonials/${t.id}/approve`} method="POST">
                  <Button type="submit" variant="ghost" size="icon" className="h-8 w-8" title="Approve">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </Button>
                </form>
              )}
              {t.status !== "ARCHIVED" && (
                <form action={`/api/testimonials/${t.id}/archive`} method="POST">
                  <Button type="submit" variant="ghost" size="icon" className="h-8 w-8" title="Archive">
                    <Archive className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </form>
              )}
              <form action={`/api/testimonials/${t.id}/delete`} method="POST">
                <Button type="submit" variant="ghost" size="icon" className="h-8 w-8" title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
