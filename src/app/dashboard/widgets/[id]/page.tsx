"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid,
  Columns3,
  GalleryHorizontal,
  List,
  MoveHorizontal,
  Save,
  Eye,
  Star,
  Check,
} from "lucide-react";

const LAYOUTS = [
  { id: "GRID", label: "Grid", icon: LayoutGrid, description: "Responsive grid of cards" },
  { id: "MASONRY", label: "Masonry", icon: Columns3, description: "Pinterest-style layout" },
  { id: "CAROUSEL", label: "Carousel", icon: GalleryHorizontal, description: "Scrollable slider" },
  { id: "LIST", label: "List", icon: List, description: "Vertical stacked list" },
  { id: "MARQUEE", label: "Marquee", icon: MoveHorizontal, description: "Auto-scrolling ticker" },
] as const;

interface WidgetConfig {
  id: string;
  name: string;
  layout: string;
  theme: Record<string, string>;
  config: Record<string, unknown>;
  showRating: boolean;
  showAvatar: boolean;
  showDate: boolean;
  maxItems: number | null;
  isActive: boolean;
}

interface Testimonial {
  id: string;
  customerName: string;
  content: string;
  rating: number | null;
  customerAvatar: string | null;
}

export default function WidgetBuilderPage() {
  const params = useParams();
  const widgetId = params.id as string;

  const [widget, setWidget] = useState<WidgetConfig | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/widgets?id=${widgetId}`).then((r) => r.json()),
      fetch("/api/testimonials?status=APPROVED").then((r) => r.json()),
    ]).then(([widgetData, testimonialsData]) => {
      setWidget(widgetData.widget);
      setTestimonials(testimonialsData.testimonials || []);
      setSelectedTestimonials(
        widgetData.widget?.testimonials?.map((t: { testimonialId: string }) => t.testimonialId) || []
      );
      setLoading(false);
    });
  }, [widgetId]);

  async function handleSave() {
    if (!widget) return;
    setSaving(true);
    try {
      await fetch("/api/widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...widget,
          testimonialIds: selectedTestimonials,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function toggleTestimonial(id: string) {
    setSelectedTestimonials((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  if (loading || !widget) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 animate-pulse rounded-lg bg-muted" />
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{widget.name}</h1>
          <p className="text-muted-foreground">Configure how your testimonials are displayed</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/w/${widgetId}`} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-2 h-4 w-4" />
              Open wall
            </a>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Layout Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Layout</CardTitle>
              <CardDescription>Choose how testimonials are arranged</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {LAYOUTS.map((layout) => {
                  const Icon = layout.icon;
                  const isSelected = widget.layout === layout.id;
                  return (
                    <button
                      key={layout.id}
                      onClick={() => setWidget({ ...widget, layout: layout.id })}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{layout.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="maxItems">Max Testimonials</Label>
                  <Input
                    id="maxItems"
                    type="number"
                    placeholder="All"
                    value={widget.maxItems || ""}
                    onChange={(e) =>
                      setWidget({
                        ...widget,
                        maxItems: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="widgetName">Widget Name</Label>
                  <Input
                    id="widgetName"
                    value={widget.name}
                    onChange={(e) => setWidget({ ...widget, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={widget.showRating}
                    onChange={(e) => setWidget({ ...widget, showRating: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Show Rating</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={widget.showAvatar}
                    onChange={(e) => setWidget({ ...widget, showAvatar: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Show Avatar</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={widget.showDate}
                    onChange={(e) => setWidget({ ...widget, showDate: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Show Date</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize colors and styling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="bgColor">Background Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={widget.theme?.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        setWidget({
                          ...widget,
                          theme: { ...widget.theme, backgroundColor: e.target.value },
                        })
                      }
                      className="h-10 w-10 rounded border"
                    />
                    <Input
                      id="bgColor"
                      value={widget.theme?.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        setWidget({
                          ...widget,
                          theme: { ...widget.theme, backgroundColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={widget.theme?.textColor || "#000000"}
                      onChange={(e) =>
                        setWidget({
                          ...widget,
                          theme: { ...widget.theme, textColor: e.target.value },
                        })
                      }
                      className="h-10 w-10 rounded border"
                    />
                    <Input
                      id="textColor"
                      value={widget.theme?.textColor || "#000000"}
                      onChange={(e) =>
                        setWidget({
                          ...widget,
                          theme: { ...widget.theme, textColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={widget.theme?.accentColor || "#7c3aed"}
                      onChange={(e) =>
                        setWidget({
                          ...widget,
                          theme: { ...widget.theme, accentColor: e.target.value },
                        })
                      }
                      className="h-10 w-10 rounded border"
                    />
                    <Input
                      id="accentColor"
                      value={widget.theme?.accentColor || "#7c3aed"}
                      onChange={(e) =>
                        setWidget({
                          ...widget,
                          theme: { ...widget.theme, accentColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testimonial Selection Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Testimonials</CardTitle>
              <CardDescription>
                {selectedTestimonials.length} selected
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] space-y-2 overflow-y-auto">
              {testimonials.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No approved testimonials yet. Approve some from the Testimonials page.
                </p>
              ) : (
                testimonials.map((t) => {
                  const isSelected = selectedTestimonials.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTestimonial(t.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isSelected ? "border-primary bg-primary text-white" : ""
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{t.customerName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {t.content?.substring(0, 60)}...
                          </p>
                          {t.rating && (
                            <div className="mt-1 flex">
                              {Array.from({ length: t.rating }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
