"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Check, Code, ExternalLink, Sparkles, Star } from "lucide-react";
import { ShareWall } from "@/components/share-wall";

export default function EmbedPage() {
  const params = useParams();
  const widgetId = params.id as string;
  const [copied, setCopied] = useState<string | null>(null);
  // Star badge picker state — controls preview + embed snippet below.
  // Kept lightweight (3 pickers) so the embed page doesn't turn into
  // a full designer; the /tools/star-badge page is where users go for
  // colors/sizes exploration.
  const [badgeStyle, setBadgeStyle] = useState<"pill" | "flat" | "minimal">("pill");
  const [badgeTheme, setBadgeTheme] = useState<"light" | "dark" | "brand" | "trust">("light");
  const [badgeSize, setBadgeSize] = useState<"sm" | "md" | "lg">("md");

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const scriptEmbed = `<div id="fw-${widgetId}"></div>
<script src="${appUrl}/embed/widget.js" data-widget-id="${widgetId}" async></script>`;

  const hostedUrl = `${appUrl}/w/${widgetId}`;

  const reactEmbed = `import { Testimoni } from '@testimoni/react';

<Testimoni widgetId="${widgetId}" />`;

  const iframeEmbed = `<iframe
  src="${appUrl}/widget-preview/${widgetId}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; overflow: hidden;"
></iframe>`;

  // Star Rating Badge — live per-widget SVG endpoint. The <img> updates
  // automatically as the workspace's rating changes (subject to the 5-min
  // edge cache). Query params control style/theme/size — see /lib/badge-svg.ts.
  const badgeUrl = `${appUrl}/badge/${widgetId}?style=${badgeStyle}&theme=${badgeTheme}&size=${badgeSize}`;
  const badgeEmbed = `<a href="${appUrl}/w/${widgetId}" target="_blank" rel="noopener">
  <img src="${badgeUrl}" alt="Star rating badge" />
</a>`;

  function copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Embed Widget</h1>
        <p className="text-muted-foreground">
          Add this widget to your website using one of the methods below
        </p>
      </div>

      <div className="space-y-4">
        {/* Hosted Wall — no-code, share as link */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Hosted Wall of Love (no code required)
            </CardTitle>
            <CardDescription>
              Share this URL anywhere — social bios, DMs, emails, Substack.
              Anyone can view; no signup needed. Perfect for coaches, agencies,
              and indie founders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-background p-4 text-sm">
                <code>{hostedUrl}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2"
                onClick={() => copyToClipboard(hostedUrl, "hosted")}
              >
                {copied === "hosted" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="default">
                <a href={hostedUrl} target="_blank" rel="noopener noreferrer">
                  Open wall <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share panel — X, LinkedIn, WhatsApp, Email, QR */}
        <ShareWall
          url={hostedUrl}
          workspaceName="Your workspace"
          testimonialCount={0}
        />

        {/* Script Tag */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Script Tag (Recommended)
            </CardTitle>
            <CardDescription>
              Drop this snippet anywhere in your HTML. Works on any website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                <code>{scriptEmbed}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2"
                onClick={() => copyToClipboard(scriptEmbed, "script")}
              >
                {copied === "script" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* React Component */}
        <Card>
          <CardHeader>
            <CardTitle>React Component</CardTitle>
            <CardDescription>
              Install the npm package and use as a React component.
              First run: <code className="text-xs bg-muted px-1 rounded">npm install @testimoni/react</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                <code>{reactEmbed}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2"
                onClick={() => copyToClipboard(reactEmbed, "react")}
              >
                {copied === "react" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Iframe */}
        <Card>
          <CardHeader>
            <CardTitle>Iframe Embed</CardTitle>
            <CardDescription>
              Simple iframe embed. Less flexible but works everywhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                <code>{iframeEmbed}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2"
                onClick={() => copyToClipboard(iframeEmbed, "iframe")}
              >
                {copied === "iframe" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Star Rating Badge — small live SVG embed showing this
            workspace's average rating + review count. Auto-updates
            (5-min cache) as new testimonials are approved. */}
        <Card id="badge" className="scroll-mt-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              Star Rating Badge
            </CardTitle>
            <CardDescription>
              A tiny embed showing your average rating + review count. Perfect
              for your footer, product pages, or email signature. Live — updates
              as you approve new testimonials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Live preview from the endpoint */}
            <div className="rounded-lg border bg-muted/30 p-6 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={badgeUrl}
                alt="Live star rating badge preview"
                className="mx-auto"
              />
            </div>

            {/* Pickers — style / theme / size */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Style</label>
                <select
                  value={badgeStyle}
                  onChange={(e) => setBadgeStyle(e.target.value as typeof badgeStyle)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="pill">Pill</option>
                  <option value="flat">Flat</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Theme</label>
                <select
                  value={badgeTheme}
                  onChange={(e) => setBadgeTheme(e.target.value as typeof badgeTheme)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="brand">Brand purple</option>
                  <option value="trust">Trust green</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Size</label>
                <select
                  value={badgeSize}
                  onChange={(e) => setBadgeSize(e.target.value as typeof badgeSize)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>
            </div>

            {/* Embed snippet */}
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                <code>{badgeEmbed}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2"
                onClick={() => copyToClipboard(badgeEmbed, "badge")}
              >
                {copied === "badge" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Direct URL:{" "}
              <a
                href={badgeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {badgeUrl}
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Widget ID */}
        <Card>
          <CardHeader>
            <CardTitle>Widget ID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={widgetId} readOnly />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(widgetId, "id")}
              >
                {copied === "id" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
