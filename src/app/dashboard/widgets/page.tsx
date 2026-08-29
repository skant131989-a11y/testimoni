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
} from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/lib/use-subscription";
import { LimitBanner } from "@/components/plan/limit-banner";

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
  const { plan, limits } = useSubscription();
  const atLimit = widgets.length >= limits.maxWidgets;

  useState(() => {
    fetch("/api/widgets")
      .then((r) => r.json())
      .then((data) => {
        setWidgets(data.widgets || []);
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
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/widgets/${widget.id}`}>
                        <Settings className="mr-1 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/widgets/${widget.id}/embed`}>
                        <Code className="mr-1 h-3 w-3" />
                        Embed
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/w/${widget.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Wall
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-destructive"
                      onClick={() => handleDelete(widget.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
