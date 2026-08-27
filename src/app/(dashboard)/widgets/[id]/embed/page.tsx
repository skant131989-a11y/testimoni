"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Check, Code } from "lucide-react";

export default function EmbedPage() {
  const params = useParams();
  const widgetId = params.id as string;
  const [copied, setCopied] = useState<string | null>(null);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const scriptEmbed = `<div id="fw-${widgetId}"></div>
<script src="${appUrl}/embed/widget.js" data-widget-id="${widgetId}" async></script>`;

  const reactEmbed = `import { FeedbackWidget } from '@feedbackwidget/react';

<FeedbackWidget widgetId="${widgetId}" />`;

  const iframeEmbed = `<iframe
  src="${appUrl}/widget-preview/${widgetId}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; overflow: hidden;"
></iframe>`;

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
              First run: <code className="text-xs bg-muted px-1 rounded">npm install @feedbackwidget/react</code>
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
