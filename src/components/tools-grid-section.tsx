"use client";

import Link from "next/link";
import {
  Search,
  Camera,
  Twitter,
  Linkedin,
  Sparkles,
  Palette,
  Mail,
  Star,
  ArrowRight,
} from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * ToolsGridSection — Section 10 on the home page.
 * Grid of 8 free tools. Each card links to its /tools/[slug] page.
 *
 * Copy leads with the "public search misses" narrative so it
 * ties back to the Section 2 wedge — "if our auto-search couldn't
 * find your praise, one of these can pull it in manually."
 */

interface Tool {
  slug: string;
  title: string;
  desc: string;
  Icon: typeof Search;
  gradient: string;
  isNew?: boolean;
}

const TOOLS: Tool[] = [
  {
    slug: "find-my-proof",
    title: "Find my proof",
    desc: "Paste your URL, we scan the whole web for praise.",
    Icon: Search,
    gradient: "from-fuchsia-500 to-purple-600",
    isNew: true,
  },
  {
    slug: "screenshot-to-testimonial",
    title: "Screenshot → testimonial",
    desc: "Drop a DM, Slack, or email screenshot. AI extracts the quote.",
    Icon: Camera,
    gradient: "from-rose-500 to-pink-600",
  },
  {
    slug: "praise-tweet-finder",
    title: "Praise Tweet Finder",
    desc: "Search X for real praise about your product, ready to embed.",
    Icon: Twitter,
    gradient: "from-sky-500 to-cyan-600",
  },
  {
    slug: "linkedin-recommendation",
    title: "LinkedIn Recommender",
    desc: "Turn a LinkedIn recommendation into a testimonial card.",
    Icon: Linkedin,
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    slug: "testimonial-writer",
    title: "Testimonial Writer",
    desc: "AI rewrites customer feedback into a punchy testimonial.",
    Icon: Sparkles,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    slug: "testimonial-card",
    title: "Testimonial Card",
    desc: "Turn any quote into a beautiful shareable image.",
    Icon: Palette,
    gradient: "from-orange-500 to-amber-600",
  },
  {
    slug: "ask-templates",
    title: "Ask Templates",
    desc: "Ready-to-copy DM & email templates that get a 40% reply rate.",
    Icon: Mail,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    slug: "star-badge",
    title: "Live Star Badge",
    desc: "Embed a live G2-style star badge on your site in one line.",
    Icon: Star,
    gradient: "from-yellow-500 to-orange-500",
  },
];

export function ToolsGridSection() {
  return (
    <section id="tools" className="border-t bg-gradient-to-br from-primary/[0.04] via-background to-fuchsia-50/30 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Free tools · No signup
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            When search misses, we&rsquo;ve got a tool for{" "}
            <span className="bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              every place
            </span>{" "}
            your customers talk.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Eight tiny AI-powered tools — one for each corner of the internet
            where praise lives. Use any of them, keep whatever you like.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t, i) => {
            const { Icon } = t;
            return (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                onClick={() =>
                  track("home_tools_grid_card_click", { slug: t.slug })
                }
                className="group relative flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {t.isNew && (
                  <span className="absolute right-3 top-3 rounded-full bg-fuchsia-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    New
                  </span>
                )}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${t.gradient} shadow-md`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold">{t.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t.desc}
                  </p>
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:gap-2">
                  Try it now <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
