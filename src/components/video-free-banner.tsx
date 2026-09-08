"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "video_free_banner_dismissed_v1";

interface VideoFreeBannerProps {
  videoCount: number;
}

export function VideoFreeBanner({ videoCount }: VideoFreeBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (videoCount > 0 || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="relative rounded-xl border border-purple-300/60 bg-gradient-to-r from-purple-50 to-fuchsia-50/60 px-4 py-2.5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-full p-1 text-purple-500 hover:bg-purple-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex flex-col gap-2 pr-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
            <Video className="h-3.5 w-3.5" />
          </div>
          <p className="text-sm">
            <span className="font-semibold">Add your first video testimonial</span>{" "}
            <span className="text-muted-foreground">— free on every plan, converts ~2× better.</span>
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href="/dashboard/import?tab=video">
            Upload <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
