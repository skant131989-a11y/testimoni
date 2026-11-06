import {
  CheckCircle2,
  Linkedin,
  MessageCircle,
  Plus,
  Star,
  Twitter,
  Video,
} from "lucide-react";

/**
 * Static product preview for the hero. Shows both ways in: a collection
 * form (ask) and the posts a scan found (find). Clearly labelled as an
 * example, because the quotes are illustrative, not real customers.
 */

const FOUND = [
  {
    Icon: Twitter,
    tint: "bg-sky-100 text-sky-700",
    source: "X",
    text: "Moved our whole onboarding over last week. Setup took ten minutes and support replied the same day.",
    added: true,
  },
  {
    Icon: Linkedin,
    tint: "bg-blue-100 text-blue-700",
    source: "LinkedIn",
    text: "Honestly the cleanest way I've found to show customer love without building it myself.",
    added: false,
  },
];

function StepPill({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] text-white">
        {n}
      </span>
      {label}
    </span>
  );
}

export function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -right-4 -top-4 h-40 w-40 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-violet-400/30 blur-3xl" />

      <div className="relative space-y-3">
        {/* 1 — Ask: a collection form */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-xl shadow-violet-500/10">
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
            <StepPill n={1} label="Ask with a form" />
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
              Example
            </span>
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold">Share your experience</p>
            <div className="mt-2 flex gap-0.5 text-amber-400">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <div className="mt-2 space-y-1.5 rounded-lg border bg-muted/30 p-3">
              <div className="h-2 w-11/12 rounded bg-border" />
              <div className="h-2 w-8/12 rounded bg-border" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <Video className="h-3.5 w-3.5" /> Record a video
              </span>
              <span className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground">
                Submit
              </span>
            </div>
          </div>
        </div>

        {/* 2 — Find: what a scan returns */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-xl shadow-violet-500/10">
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
            <StepPill n={2} label="Find what's already online" />
            <span className="text-xs text-muted-foreground">14 posts found</span>
          </div>
          <div className="space-y-2.5 p-4">
            {FOUND.map((f) => (
              <div key={f.text} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${f.tint}`}
                  >
                    <f.Icon className="h-3 w-3" /> {f.source}
                  </span>
                  {f.added ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> On your wall
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      <Plus className="h-3 w-3" /> Add to wall
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{f.text}&rdquo;
                </p>
              </div>
            ))}
            <p className="flex items-center gap-1.5 pt-0.5 text-[11px] text-muted-foreground">
              <MessageCircle className="h-3 w-3" /> Every quote keeps its author and a link to the original post.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
