"use client";

import { useState } from "react";
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
} from "lucide-react";

type Mode = "url" | "manual";

export default function ImportPage() {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [manualData, setManualData] = useState({
    customerName: "",
    customerEmail: "",
    customerTitle: "",
    content: "",
    rating: 5,
  });
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [successWidgetId, setSuccessWidgetId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUrlImport() {
    if (!url.trim()) return;
    setImporting(true);
    setError("");
    setSuccess(null);
    setSuccessWidgetId(null);
    try {
      const res = await fetch("/api/testimonials/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }
      const name = data.testimonial?.customerName ?? "the author";
      setSuccess(`Imported testimonial from ${name}. Added to your library.`);
      setSuccessWidgetId(data.widget?.id ?? null);
      setUrl("");
    } catch {
      setError("Something went wrong");
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
    } catch {
      setError("Something went wrong");
    } finally {
      setImporting(false);
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

      <div className="flex gap-2">
        <Button
          variant={mode === "url" ? "default" : "outline"}
          onClick={() => {
            setMode("url");
            setError("");
            setSuccess(null);
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
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Manual entry
        </Button>
      </div>

      {mode === "url" ? (
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
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
                </div>
              </div>
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
    </div>
  );
}
