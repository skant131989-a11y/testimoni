"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/**
 * Hero-tab panel: paste a website, land on the Customer Voice scan
 * with the URL pre-filled (that page auto-runs the scan). Unlike the
 * other hero tabs this one leaves the page, so the copy says so.
 */
const CATEGORIES = [
  "❤️ Praise",
  "🏆 Testimonials",
  "😤 Complaints",
  "💡 Feature requests",
  "🎯 Use cases",
  "⚔️ Competitors",
];

const EXAMPLES = ["notion.so", "linear.app"];

export function WebsiteScanDemo() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [going, setGoing] = useState(false);

  function go(value: string) {
    const trimmed = value.trim();
    if (!trimmed || going) return;
    setGoing(true);
    track("hero_url_submitted", { url: trimmed, source: "hero_tab" }, { anonymous: true });
    router.push(`/tools/customer-voice?url=${encodeURIComponent(trimmed)}&from=hero_tab`);
  }

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(url);
        }}
      >
        <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
          <span className="font-medium text-foreground">Paste your website</span>
          <span className="text-muted-foreground/60">
            ~10 seconds · opens your results · no signup
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourproduct.com"
            aria-label="Your website"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="text-xs sm:text-sm"
          />
          <Button type="submit" size="sm" disabled={!url.trim() || going} className="shrink-0">
            {going ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                Scan <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>

      <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
        <span>Try:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => go(example)}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {example}
          </button>
        ))}
      </p>

      <div className="mt-4 rounded-md border bg-background p-3">
        <p className="text-[11px] font-semibold text-foreground">
          We search the web and sort what we find into:
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          {CATEGORIES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">
          The praise becomes testimonials for your Wall of Love, each with its source link.
        </p>
      </div>
    </div>
  );
}
