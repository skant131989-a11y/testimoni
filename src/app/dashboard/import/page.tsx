"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Link as LinkIcon, FileText, CheckCircle2, Loader2 } from "lucide-react";

export default function ImportPage() {
  const [mode, setMode] = useState<"url" | "manual">("manual");
  const [url, setUrl] = useState("");
  const [manualData, setManualData] = useState({
    customerName: "",
    customerEmail: "",
    customerTitle: "",
    content: "",
    rating: 5,
  });
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleImport() {
    setImporting(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualData,
          source: mode === "url" ? "IMPORT" : "MANUAL",
          sourceUrl: mode === "url" ? url : undefined,
          status: "APPROVED",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Import failed");
        return;
      }

      setSuccess(true);
      setManualData({ customerName: "", customerEmail: "", customerTitle: "", content: "", rating: 5 });
      setUrl("");
      setTimeout(() => setSuccess(false), 3000);
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
          Add existing testimonials from other sources
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
        >
          <FileText className="mr-2 h-4 w-4" />
          Manual Entry
        </Button>
        <Button
          variant={mode === "url" ? "default" : "outline"}
          onClick={() => setMode("url")}
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          From URL
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "manual" ? "Add Testimonial Manually" : "Import from URL"}
          </CardTitle>
          <CardDescription>
            {mode === "manual"
              ? "Enter the testimonial details below"
              : "Paste a tweet or review URL to import"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "url" && (
            <div>
              <Label htmlFor="import-url">Source URL</Label>
              <Input
                id="import-url"
                placeholder="https://twitter.com/user/status/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Supports Twitter/X posts. The content will be imported along with the author info.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={manualData.customerName}
                onChange={(e) => setManualData({ ...manualData, customerName: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={manualData.customerEmail}
                onChange={(e) => setManualData({ ...manualData, customerEmail: e.target.value })}
                placeholder="jane@company.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title / Company</Label>
            <Input
              id="title"
              value={manualData.customerTitle}
              onChange={(e) => setManualData({ ...manualData, customerTitle: e.target.value })}
              placeholder="CEO at Acme Inc"
            />
          </div>

          <div>
            <Label htmlFor="content">Testimonial Content *</Label>
            <Textarea
              id="content"
              value={manualData.content}
              onChange={(e) => setManualData({ ...manualData, content: e.target.value })}
              placeholder="Their testimonial goes here..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="rating">Rating (1-5)</Label>
            <Input
              id="rating"
              type="number"
              min={1}
              max={5}
              value={manualData.rating}
              onChange={(e) => setManualData({ ...manualData, rating: parseInt(e.target.value) || 5 })}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Testimonial imported successfully!
            </p>
          )}

          <Button onClick={handleImport} disabled={importing || !manualData.customerName || !manualData.content}>
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Testimonial
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
