"use client";

import { useState } from "react";
import {
  Twitter,
  Linkedin,
  Link2,
  Check,
  MessageCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/**
 * Share buttons for a hosted Wall of Love. Two rows:
 *
 *   Row 1 (prominent):  X · LinkedIn · Copy link
 *   Row 2 (secondary):  WhatsApp · Email · Reddit
 *
 * The prominent row targets the most-used surfaces for indie /
 * SaaS shares (X + LinkedIn) plus Copy link — which covers every
 * platform without a real web share API (Instagram DMs, Discord,
 * Slack). The secondary row is smaller / lighter for surfaces that
 * matter less but are cheap to include.
 *
 * Instagram + Product Hunt are intentionally omitted — neither
 * exposes a public web share intent, so a button there would just
 * copy text (fake share UX).
 *
 * All analytics events pass through the global track(), which on
 * a public path (this component only mounts inside /w/...) auto-
 * forces anonymous mode — the workspace owner's identity never
 * leaks into wall_share_* events.
 */
interface Props {
  wallUrl: string;
  workspaceName: string;
  reviewCount: number;
}

// One caption reused across surfaces. Reads like a genuine
// recommendation, not marketing. "🩷" is a low-key emoji choice —
// the ❤️ would read as promo, this one reads as personal.
function buildCaption(workspaceName: string, count: number): string {
  return count > 0
    ? `Real reviews of ${workspaceName} 🩷`
    : `Check out ${workspaceName}'s Wall of Love`;
}

export function WallShareButtons({
  wallUrl,
  workspaceName,
  reviewCount,
}: Props) {
  const [copied, setCopied] = useState(false);
  const caption = buildCaption(workspaceName, reviewCount);
  const encodedUrl = encodeURIComponent(wallUrl);
  const encodedText = encodeURIComponent(caption);

  const shares = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    // WhatsApp accepts a single `text` param — URL + caption concatenated.
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${caption} ${wallUrl}`)}`,
    // mailto renders subject + body in the user's default mail client.
    email: `mailto:?subject=${encodedText}&body=${encodeURIComponent(`${caption}\n\n${wallUrl}`)}`,
    // Reddit's submit endpoint prefills the URL + title fields.
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
  };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(wallUrl);
      setCopied(true);
      track("wall_share_clicked", { platform: "copy_link" });
      // Reset after 2s so the checkmark doesn't confuse users who
      // want to copy again for a second surface.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied / unsupported — silently ignore;
      // the surrounding row still has 5 other share options.
    }
  }

  function fireTrack(platform: string) {
    track("wall_share_clicked", { platform });
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      {/* Row 1 — most-used surfaces */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="gap-1.5 rounded-full"
        >
          <a
            href={shares.twitter}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => fireTrack("twitter")}
          >
            <Twitter className="h-3.5 w-3.5" />
            Share on X
          </a>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="gap-1.5 rounded-full"
        >
          <a
            href={shares.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => fireTrack("linkedin")}
          >
            <Linkedin className="h-3.5 w-3.5" />
            Share on LinkedIn
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="gap-1.5 rounded-full"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-primary" />
              Copied
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" />
              Copy link
            </>
          )}
        </Button>
      </div>

      {/* Row 2 — secondary surfaces. Smaller + quieter so they don't
          compete with row 1 for attention but stay one click away. */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <a
          href={shares.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => fireTrack("whatsapp")}
          className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-border hover:text-primary"
        >
          <MessageCircle className="h-3 w-3" />
          WhatsApp
        </a>
        <a
          href={shares.email}
          onClick={() => fireTrack("email")}
          className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-border hover:text-primary"
        >
          <Mail className="h-3 w-3" />
          Email
        </a>
        <a
          href={shares.reddit}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => fireTrack("reddit")}
          className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-border hover:text-primary"
        >
          {/* Reddit's alien mark — lucide doesn't ship a Reddit icon,
              so we render the official mono glyph inline. */}
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.2 11.8c.03.2.05.4.05.61 0 3.1-3.6 5.61-8.05 5.61s-8.05-2.51-8.05-5.61c0-.21.02-.41.05-.61C.34 13.42 0 12.76 0 12c0-1.24.94-2.24 2.1-2.24.59 0 1.13.26 1.51.68 1.5-1.05 3.55-1.73 5.83-1.83l1.11-5.16c.03-.11.15-.19.26-.16l3.62.77c.24-.5.77-.85 1.38-.85.85 0 1.55.68 1.55 1.53 0 .84-.7 1.52-1.55 1.52-.83 0-1.51-.65-1.55-1.47l-3.28-.7-1 4.66c2.27.1 4.32.79 5.83 1.84.38-.42.92-.68 1.51-.68 1.16 0 2.1 1 2.1 2.24 0 .76-.34 1.42-.86 1.8z" />
          </svg>
          Reddit
        </a>
      </div>

      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Loved this? Pass it on.
      </p>
    </div>
  );
}
