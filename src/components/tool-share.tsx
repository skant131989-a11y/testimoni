"use client";

import { useState } from "react";
import { Check, Link2, Linkedin, MessageCircle, Share2, Twitter } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * "Send this to someone" row for the free tools. Each channel gets its own
 * utm_medium so PostHog shows which one brings people back. With no `path`
 * it shares the page the visitor is on (used for Customer Voice reports).
 */
export function ToolShare({
  tool,
  text,
  path,
  title = "Know someone who needs this?",
}: {
  /** Short name for analytics, e.g. "writer". */
  tool: string;
  /** The message that goes with the link. */
  text: string;
  /** Page to share. Defaults to the current page. */
  path?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  function urlFor(medium: string): string {
    const base = typeof window !== "undefined" ? window.location.origin : "https://testimoni.io";
    const p = path ?? (typeof window !== "undefined" ? window.location.pathname : "/tools");
    const u = new URL(p, base);
    u.searchParams.set("utm_source", "share");
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", "tool_share");
    return u.toString();
  }

  async function copy() {
    await navigator.clipboard.writeText(`${text} ${urlFor("copy")}`);
    setCopied(true);
    track("tool_shared", { tool, channel: "copy" });
    setTimeout(() => setCopied(false), 2000);
  }

  const open = (channel: string, href: string) => () => {
    track("tool_shared", { tool, channel });
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const btn =
    "inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary";

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-primary/15 pt-4">
      <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Share2 className="h-3.5 w-3.5" /> {title}
      </span>
      <button type="button" onClick={copy} className={btn}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        type="button"
        className={btn}
        onClick={() =>
          open(
            "x",
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(urlFor("x"))}`
          )()
        }
      >
        <Twitter className="h-3.5 w-3.5" /> Post on X
      </button>
      <button
        type="button"
        className={btn}
        onClick={() =>
          open(
            "linkedin",
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlFor("linkedin"))}`
          )()
        }
      >
        <Linkedin className="h-3.5 w-3.5" /> LinkedIn
      </button>
      <button
        type="button"
        className={btn}
        onClick={() =>
          open("whatsapp", `https://wa.me/?text=${encodeURIComponent(`${text} ${urlFor("whatsapp")}`)}`)()
        }
      >
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
      </button>
    </div>
  );
}
