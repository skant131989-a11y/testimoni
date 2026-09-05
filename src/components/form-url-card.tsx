"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

interface FormUrlCardProps {
  /** Absolute or relative form URL. Absolute preferred so Copy gets
   *  the full shareable link (email, DM, follow-up messages). */
  formUrl: string;
  /** Surface for analytics — "dashboard" is the main use. */
  surface: string;
}

/**
 * Persistent form-link card for the dashboard.
 *
 * The collection form URL is the #1 asset a new user needs to share
 * with customers. Before this card was added, it only appeared as
 * an ephemeral next-best-action recommendation — invisible once the
 * user took any other action. Now it's always visible at the top of
 * the dashboard when a form exists, one-click copy, one-click open.
 *
 * Matches WallUrlCard's shape (icon + label + URL + action buttons)
 * so the two cards read as siblings on the dashboard.
 */
export function FormUrlCard({ formUrl, surface }: FormUrlCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      track("form_url_copied", { surface });
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <Inbox className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Your collection form
            </p>
          </div>
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block truncate font-mono text-xs text-foreground hover:text-primary hover:underline sm:text-sm"
            onClick={() => track("form_view_clicked", { surface, via: "url_text" })}
          >
            {formUrl}
          </a>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Send this to customers — email, DM, follow-up. Every reply lands in your inbox for approval.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:shrink-0">
          <Button variant="outline" size="sm" onClick={copyUrl}>
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link
              </>
            )}
          </Button>
          <Button asChild size="sm">
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("form_view_clicked", { surface, via: "button" })}
            >
              Preview <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
