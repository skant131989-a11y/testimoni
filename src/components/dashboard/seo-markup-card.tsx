"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildReviewSchema, schemaToScriptJson } from "@/lib/review-schema";

/**
 * "Make your reviews readable by Google and AI". The embed script already
 * adds this markup in the browser; this snippet puts it straight into the
 * page's HTML, where crawlers that don't run JavaScript can read it too.
 */
export function SeoMarkupCard({ widgetId }: { widgetId: string }) {
  const [snippet, setSnippet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/widget/${widgetId}`)
      .then((r) => r.json())
      .then((data) => {
        const schema = buildReviewSchema({
          name: data.workspace?.name ?? "",
          url: data.workspace?.url ?? null,
          testimonials: data.testimonials ?? [],
        });
        if (schema && data.workspace?.name) {
          setSnippet(`<script type="application/ld+json">${schemaToScriptJson(schema)}</script>`);
        }
      })
      .catch(() => {});
  }, [widgetId]);

  if (!snippet) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Make your reviews readable by Google and AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          The widget already adds review markup (schema.org) when it loads, which Google reads. Some
          crawlers, including many AI ones, don&rsquo;t run JavaScript. Paste this into the{" "}
          <code className="rounded bg-muted px-1">&lt;head&gt;</code> of the page that shows your wall so
          they can read your reviews too. Refresh it when you add new testimonials.
        </p>
        <div className="flex items-start gap-2">
          <pre className="max-h-40 flex-1 overflow-auto rounded-lg border bg-muted p-3 text-xs text-foreground">
            <code>{snippet}</code>
          </pre>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(snippet);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
