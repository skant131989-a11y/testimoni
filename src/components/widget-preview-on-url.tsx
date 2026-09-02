"use client";

import { useState } from "react";
import { Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";

/**
 * Mock browser frame with the user's homepage URL in the address bar
 * and their widget "embedded" below. No real screenshot — we don't
 * scrape the customer's actual site (privacy + speed). Instead we
 * render a plausible browser chrome with their URL text and drop the
 * embed script into an iframe below to show what the wall would look
 * like on their site's canvas.
 *
 * The value isn't visual fidelity — it's proof they can share this
 * artefact with a client / boss and go "here's what it looks like on
 * our site." Currently the widgets page can only show the raw code.
 */
export function WidgetPreviewOnUrl({
  widgetId,
  origin,
}: {
  widgetId: string;
  /** Origin used to build the embed script src — window.location.origin
   *  in the client. Passed so this component can render in the
   *  server-side edit page without needing to hydrate first. */
  origin: string;
}) {
  const [userUrl, setUserUrl] = useState("");
  const [previewing, setPreviewing] = useState(false);

  function showPreview() {
    if (!userUrl.trim()) return;
    setPreviewing(true);
    track("widget_url_preview_shown", { widget_id: widgetId });
  }

  const displayUrl = userUrl.trim() || "https://your-site.com";
  const embedHtml = `<!DOCTYPE html><html><head><title>Preview</title><style>body{margin:0;padding:32px;font-family:system-ui;background:#fafafa;color:#111}h1{font-size:32px;margin:0 0 8px}h2{font-size:14px;color:#666;margin:24px 0 12px;text-transform:uppercase;letter-spacing:0.08em}</style></head><body><h1>${escapeHtml(hostFrom(displayUrl))}</h1><p style="color:#666;font-size:15px">This is a preview of how your Wall of Love would look on this page.</p><h2>What our customers say</h2><div id="fw-${widgetId}"></div><script src="${origin}/embed/widget.js" data-widget-id="${widgetId}" async></script></body></html>`;

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-semibold">See it on your site</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Enter your site URL — we&apos;ll show a preview with your wall
        embedded. Share the preview with a client or teammate to see how
        it looks in context.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://your-site.com"
            value={userUrl}
            onChange={(e) => setUserUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && showPreview()}
            className="h-6 border-0 p-0 text-xs focus-visible:ring-0"
          />
        </div>
        <Button size="sm" onClick={showPreview} disabled={!userUrl.trim()}>
          Preview
        </Button>
      </div>

      {previewing && (
        <div className="mt-4 overflow-hidden rounded-lg border bg-background shadow-sm">
          {/* Mock browser chrome */}
          <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2">
            <div className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="ml-2 flex flex-1 items-center gap-1.5 truncate rounded-md bg-background px-2 py-1 text-[11px] font-mono text-muted-foreground">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{displayUrl}</span>
            </div>
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              title="Open the real page in a new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <iframe
            title="Widget preview"
            className="h-[520px] w-full border-0"
            srcDoc={embedHtml}
          />
        </div>
      )}
    </div>
  );
}

function hostFrom(url: string): string {
  try {
    return new URL(url.match(/^https?:/) ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
