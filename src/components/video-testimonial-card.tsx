"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

/**
 * Renders a video testimonial as a thumbnail with a play overlay. When
 * the user clicks, we mount a modal with a native <video> element and
 * autoplay. Sitting in a client component keeps the wall page a server
 * component; every other card on the wall stays static.
 *
 * We do NOT auto-generate thumbnails — instead we let the browser pull
 * the first frame via `preload="metadata"` on a hidden <video>, which
 * paints on load without downloading the whole file.
 */
export function VideoTestimonialCard({
  videoUrl,
  customerName,
}: {
  videoUrl: string;
  customerName: string;
}) {
  const [open, setOpen] = useState(false);

  // Escape-to-close + prevent body scroll while modal open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-black"
        aria-label={`Play video testimonial from ${customerName}`}
      >
        <video
          src={videoUrl}
          preload="metadata"
          muted
          playsInline
          className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/40">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:scale-110">
            <Play className="h-6 w-6 fill-black text-black" />
          </div>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Video testimonial from ${customerName}`}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 rounded-full p-1 text-white/80 hover:text-white"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <video
              src={videoUrl}
              autoPlay
              controls
              playsInline
              className="w-full rounded-lg bg-black shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
