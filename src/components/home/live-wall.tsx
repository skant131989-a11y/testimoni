"use client";

import { useEffect, useRef } from "react";

/**
 * Embeds a real Testimoni wall on the page with the same one-line
 * script customers paste on their own sites. The script is added when
 * the section scrolls near the viewport, so it never costs first paint.
 *
 * widget.js remembers which widgets it already rendered; when this
 * component unmounts (client navigation away) we clear that flag so the
 * wall renders again when the visitor comes back.
 */
export function LiveWall({ widgetId }: { widgetId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let injected = false;

    const inject = () => {
      if (injected) return;
      injected = true;
      const s = document.createElement("script");
      s.src = "/embed/widget.js";
      s.async = true;
      s.setAttribute("data-widget-id", widgetId);
      el.appendChild(s);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          inject();
          io.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      const t = (window as unknown as { Testimoni?: Record<string, unknown> }).Testimoni;
      if (t) delete t[`_loaded_${widgetId}`];
    };
  }, [widgetId]);

  return <div ref={ref} className="min-h-[320px]" />;
}
