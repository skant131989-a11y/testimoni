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
    <div className="relative rounded-2xl border-2 border-purple-300/60 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-full p-1 text-purple-500 hover:bg-purple-100"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col gap-4 pr-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
              1 free video on every plan
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              Add your first video testimonial
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Video converts ~2× better than text. Upload an MP4/MOV, or ask a
              customer to record from their phone.
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="/dashboard/import?tab=video">
            Upload video <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
