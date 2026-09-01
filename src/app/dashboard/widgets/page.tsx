"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  LayoutGrid,
  Columns3,
  GalleryHorizontal,
  List,
  MoveHorizontal,
  Settings,
  Eye,
  Code,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  MessageSquareQuote,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/lib/use-subscription";
import { LimitBanner } from "@/components/plan/limit-banner";
import { track } from "@/lib/analytics";

const LAYOUTS = [
  { id: "GRID", label: "Grid", icon: LayoutGrid },
  { id: "MASONRY", label: "Masonry", icon: Columns3 },
  { id: "CAROUSEL", label: "Carousel", icon: GalleryHorizontal },
  { id: "LIST", label: "List", icon: List },
  { id: "MARQUEE", label: "Marquee", icon: MoveHorizontal },
] as const;

interface Widget {
  id: string;
  name: string;
  layout: string;
  isActive: boolean;
  createdAt: string;
  _count: { testimonials: number };
}

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("Homepage Testimonials");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // Which widget's embed snippet is expanded inline on the card,
  // and which one just showed the Copied confirmation.
  const [openEmbedFor, setOpenEmbedFor] = useState<string | null>(null);
  const [copiedEmbedFor, setCopiedEmbedFor] = useState<string | null>(null);
  const { plan, limits } = useSubscription();
  const atLimit = widgets.length >= limits.maxWidgets;

  useState(() => {
    fetch("/api/widgets")
      .then((r) => r.json())
      .then((data) => {
        const list = data.widgets || [];
        setWidgets(list);
        // Auto-expand the embed section on the default (first) widget
        // so users can copy code without a click. Especially useful on
        // Free plan where there's just one widget — page feels ready
        // to act on, not empty. Users can collapse it or expand a
        // different widget's snippet by clicking Embed.
        if (list.length > 0) {
          setOpenEmbedFor(list[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  });

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        const data = await res.json();
        setWidgets((prev) => [data.widget, ...prev]);
        setNewName("Homepage Testimonials");
        setShowCreate(false);
        track("widget_created", { widgetId: data.widget?.id, layout: data.widget?.layout });
      } else {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || "Could not create widget. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this widget?")) return;
    await fetch(`/api/widgets`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }

  const getLayoutIcon = (layout: string) => {
    const found = LAYOUTS.find((l) => l.id === layout);
    return found ? found.icon : LayoutGrid;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Widgets</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Widgets</h1>
        <Button
          onClick={() => setShowCreate(true)}
          disabled={atLimit}
          title={atLimit ? "Free plan is limited to 1 widget. Upgrade to Pro." : undefined}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Widget
        </Button>
      </div>

      {atLimit && plan === "FREE" && (
        <LimitBanner
          resource="widget"
          usage={`${widgets.length} / ${limits.maxWidgets}`}
          description="Pro unlocks unlimited widgets, all layouts (Masonry, Carousel, Marquee), and removes the watermark."
        />
      )}

      {showCreate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="widget-name">Widget Name</Label>
                <Input
                  id="widget-name"
                  placeholder="e.g., Homepage Testimonials"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
            {createError && (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{createError}</p>
                {createError.toLowerCase().includes("limit") && (
                  <a
                    href="/dashboard/settings/billing"
                    className="mt-1 inline-block text-xs font-semibold text-destructive underline"
                  >
                    Upgrade to Pro →
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {widgets.length === 0 && !showCreate ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No widgets yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first widget to start displaying testimonials on your
              site.
            </p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget) => {
            const LayoutIcon = getLayoutIcon(widget.layout);
            return (
              <Card key={widget.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{widget.name}</CardTitle>
                    <Badge variant={widget.isActive ? "default" : "secondary"}>
                      {widget.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LayoutIcon className="h-4 w-4" />
                    <span>{widget.layout}</span>
                    <span className="mx-1">·</span>
                    <span>{widget._count?.testimonials || 0} testimonials</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      variant={openEmbedFor === widget.id ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setOpenEmbedFor(
                          openEmbedFor === widget.id ? null : widget.id
                        )
                      }
                    >
                      <Code className="mr-1 h-3 w-3" />
                      Embed
                      <ChevronDown
                        className={`ml-1 h-3 w-3 transition-transform ${openEmbedFor === widget.id ? "rotate-180" : ""}`}
                      />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/w/${widget.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Wall
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/widgets/${widget.id}`}>
                        <Settings className="mr-1 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-destructive"
                      onClick={() => handleDelete(widget.id)}
                      aria-label="Delete widget"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Inline embed snippet — expands directly on the
                      card so users on Free plan (one widget) can copy
                      code without navigating to a whole new page.
                      "More options" link opens the full embed page
                      with iframe/React variants + custom colors. */}
                  {openEmbedFor === widget.id && (
                    <div className="mt-4 rounded-md border bg-muted/40 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Paste this on any page — Framer, Webflow, WordPress,
                        React, plain HTML.
                      </p>
                      <pre className="mt-2 overflow-x-auto rounded border bg-background p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
                        <code>{buildEmbedSnippet(widget.id)}</code>
                      </pre>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              buildEmbedSnippet(widget.id)
                            );
                            setCopiedEmbedFor(widget.id);
                            track("embed_copied", { source: "widgets_page" });
                            setTimeout(() => setCopiedEmbedFor(null), 2000);
                          }}
                          variant={
                            copiedEmbedFor === widget.id ? "default" : "outline"
                          }
                        >
                          {copiedEmbedFor === widget.id ? (
                            <>
                              <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy code
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/dashboard/widgets/${widget.id}/embed`}>
                            More embed options →
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* How-to + FAQ — most-asked-about topics for new users, right
          on the widgets page so they don't have to hunt for docs.
          Especially useful on Free plan where the widgets page can
          feel light with just one default widget. */}
      {widgets.length > 0 && !loading && (
        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MessageSquareQuote className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  How do testimonials show up on a widget?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every approved testimonial in your workspace is
                  auto-added to your default widget. To pick specific
                  testimonials per widget or reorder them, click{" "}
                  <strong className="text-foreground">Edit</strong> on the
                  widget above.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href="/dashboard/import">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add a testimonial
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/inbox">
                      <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                      Review inbox
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm font-semibold">FAQ</p>
            <dl className="mt-3 space-y-4 text-sm">
              <div>
                <dt className="font-medium">
                  How do I add testimonials to a widget?
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  Approved testimonials in your workspace are added to
                  your default widget automatically. Import via{" "}
                  <Link
                    href="/dashboard/import"
                    className="text-primary hover:underline"
                  >
                    Import
                  </Link>{" "}
                  (URL, manual entry, or video) or collect fresh ones via{" "}
                  <Link
                    href="/dashboard/collect"
                    className="text-primary hover:underline"
                  >
                    Collect
                  </Link>{" "}
                  form.
                </dd>
              </div>
              <div>
                <dt className="font-medium">
                  Can I show different testimonials on different widgets?
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  Yes — Pro plan. Every widget picks which testimonials
                  to show. The same testimonial can appear on multiple
                  widgets, or on none.
                </dd>
              </div>
              <div>
                <dt className="font-medium">
                  Where do I paste the embed code?
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  Anywhere HTML runs — Framer&apos;s Custom Code panel,
                  Webflow&apos;s Embed element, WordPress Custom HTML
                  block, or a React component with{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs">
                    dangerouslySetInnerHTML
                  </code>
                  . The widget renders inside a Shadow DOM so it never
                  conflicts with your site&apos;s CSS.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Do I have to use the embed?</dt>
                <dd className="mt-1 text-muted-foreground">
                  No — every workspace gets a public{" "}
                  <strong className="text-foreground">Wall of Love URL</strong>{" "}
                  you can share directly (Instagram bio, DMs, QR code).
                  Click <strong className="text-foreground">Wall</strong>{" "}
                  above to open yours.
                </dd>
              </div>
              <div>
                <dt className="font-medium">
                  Can I change the layout, colors, or fonts?
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  Yes — click <strong className="text-foreground">Edit</strong>{" "}
                  on any widget. Free plan uses the Grid layout;{" "}
                  <Link
                    href="/pricing"
                    className="text-primary hover:underline"
                  >
                    Pro
                  </Link>{" "}
                  unlocks Masonry, Carousel, List, and Marquee, plus
                  custom colors and no watermark.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One-line embed snippet — div anchor + async script. Same shape as
 * the welcome page and import page snippets. Kept here as a helper
 * so widget cards can render the code inline without pulling in the
 * whole embed page component.
 */
function buildEmbedSnippet(widgetId: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://testimoni.io";
  return `<div id="fw-${widgetId}"></div>\n<script src="${origin}/embed/widget.js" data-widget-id="${widgetId}" async></script>`;
}
