import { CheckCircle2, Linkedin, MessageCircle, Plus, Search, Twitter } from "lucide-react";

/**
 * Static product preview for the hero: what a scan returns and what
 * lands on the wall. Clearly labelled as an example, because the
 * quotes are illustrative, not real customers.
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
    added: true,
  },
  {
    Icon: MessageCircle,
    tint: "bg-orange-100 text-orange-700",
    source: "Reddit",
    text: "Switched from a spreadsheet of screenshots. Wish I had done it a year ago.",
    added: false,
  },
];

export function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -right-4 -top-4 h-40 w-40 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-full bg-violet-400/30 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border bg-white shadow-2xl shadow-violet-500/15">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <div className="ml-3 flex flex-1 items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border">
            <Search className="h-3 w-3" /> yourproduct.com
          </div>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            Example
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">14 posts found about you</p>
            <p className="text-xs text-muted-foreground">X · LinkedIn · Reddit</p>
          </div>

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
        </div>

        <div className="border-t bg-muted/30 px-4 py-2.5 text-center text-xs text-muted-foreground">
          Every quote keeps the author and a link to the original post.
        </div>
      </div>
    </div>
  );
}
