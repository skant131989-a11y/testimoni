import { CheckCircle2, Code2, Linkedin, MessageCircle, Star, Twitter } from "lucide-react";
import type { WallQuote, WallSource } from "@/lib/home-wall";

/**
 * The hero's picture of the outcome: a real Wall of Love sitting on a
 * website. Quotes are Testimoni's own, read from the live wall; if none are
 * available it falls back to clearly labelled examples.
 */

const FALLBACK: WallQuote[] = [
  { content: "Setup took ten minutes and support replied the same day. Honestly the cleanest onboarding I've had this year.", name: "Maya R.", title: "Founder", source: "X", url: null },
  { content: "We put the wall on our pricing page and trial signups went up within the week.", name: "Daniel K.", title: "Head of Growth", source: "LinkedIn", url: null },
  { content: "Found three quotes I'd forgotten about and had them live before my coffee got cold.", name: "Priya S.", title: "Indie hacker", source: "X", url: null },
  { content: "The only testimonial tool that didn't make me chase anyone. It just found the praise.", name: "Tom B.", title: "Agency owner", source: "Reddit", url: null },
];

const SOURCE_STYLE: Record<WallSource, string> = {
  X: "bg-sky-100 text-sky-700",
  LinkedIn: "bg-blue-100 text-blue-700",
  Reddit: "bg-orange-100 text-orange-700",
  "Product Hunt": "bg-rose-100 text-rose-700",
  "Hacker News": "bg-amber-100 text-amber-800",
  Web: "bg-violet-100 text-violet-700",
};

function SourceIcon({ source }: { source: WallSource }) {
  if (source === "X") return <Twitter className="h-3 w-3" />;
  if (source === "LinkedIn") return <Linkedin className="h-3 w-3" />;
  return <MessageCircle className="h-3 w-3" />;
}

function initials(name: string) {
  return name
    .replace(/^@/, "")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function QuoteCard({ q, float }: { q: WallQuote; float: string }) {
  return (
    <figure
      className={`${float} rounded-2xl border border-violet-100 bg-white p-4 shadow-lg shadow-violet-500/10`}
    >
      <div className="flex items-center justify-between">
        <span className="flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-current" />
          ))}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${SOURCE_STYLE[q.source]}`}
        >
          <SourceIcon source={q.source} /> {q.source}
        </span>
      </div>
      <blockquote className="mt-2.5 line-clamp-4 text-[13px] leading-relaxed text-foreground/90">
        &ldquo;{q.content}&rdquo;
      </blockquote>
      <figcaption className="mt-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
          {initials(q.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">{q.name}</span>
          {q.title && <span className="block truncate text-[11px] text-muted-foreground">{q.title}</span>}
        </span>
        {q.url && <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Linked to the original post" />}
      </figcaption>
    </figure>
  );
}

export function HeroWall({ quotes }: { quotes: WallQuote[] }) {
  const real = quotes.length >= 3;
  const list = (real ? quotes : FALLBACK).slice(0, 4);
  const left = [list[0], list[2]].filter(Boolean);
  const right = [list[1], list[3]].filter(Boolean);

  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* glow, in the logo's violet */}
      <div className="pointer-events-none absolute -left-10 top-10 h-56 w-56 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 bottom-0 h-56 w-56 rounded-full bg-fuchsia-400/25 blur-3xl" />

      {/* a website with the wall on it */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-200/80 bg-white/80 shadow-2xl shadow-violet-500/20 backdrop-blur">
        <div className="flex items-center gap-2 border-b bg-white/70 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 truncate rounded-full bg-violet-50 px-3 py-0.5 text-[11px] text-violet-700/80">
            yourproduct.com/pricing
          </span>
        </div>
        <div className="bg-gradient-to-b from-violet-50/70 to-white p-4 sm:p-5">
          <p className="text-center text-sm font-bold tracking-tight">
            Loved by customers like you
          </p>
          <p className="mt-0.5 text-center text-[11px] text-muted-foreground">
            {real ? "Real posts from Testimoni's own wall" : "Example wall"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="space-y-3">
              {left.map((q, i) => (
                <QuoteCard key={q.content} q={q} float={i === 0 ? "hero-float-a" : "hero-float-b"} />
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {right.map((q, i) => (
                <QuoteCard key={q.content} q={q} float={i === 0 ? "hero-float-b" : "hero-float-a"} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* what it took */}
      <div className="hero-float-b absolute -bottom-5 left-3 hidden items-center gap-2 rounded-xl border border-violet-200 bg-slate-950 px-3 py-2 font-mono text-[11px] text-slate-100 shadow-xl sm:flex">
        <Code2 className="h-3.5 w-3.5 text-violet-300" />
        <span className="text-slate-400">one line of code</span>
        <span className="text-emerald-300">&lt;script src=&quot;…/widget.js&quot;&gt;</span>
      </div>
      <div className="hero-float-a absolute -right-2 -top-3 hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-lg sm:inline-flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Live on your site
      </div>
    </div>
  );
}
