import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Send,
  Inbox,
  LayoutGrid,
  Code2,
  Video,
  Palette,
  ShieldCheck,
  Twitter,
  Heart,
  MessageSquare,
  Star,
  MonitorSmartphone,
  Sparkles,
  Search,
  Link2,
  Camera,
  Linkedin,
  Zap,
  Gauge,
  CheckCircle2,
  FileText,
  Trophy,
  Award,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { InlineSignup } from "@/components/inline-signup";
import { TrackedLink } from "@/components/tracked-link";
import { LovedByFoundersStrip } from "@/components/loved-by-founders-strip";

export const metadata: Metadata = {
  title: "Features — Testimoni · Every way to build a Wall of Love",
  description:
    "Auto-find praise across the web, drop a link, send a form, or use one of our 8 free tools. Plus the full feature list — intake, curation, display, and Pro AI.",
  alternates: { canonical: "/features" },
};

// ── Small feature/section building blocks ──────────────────────

interface CompactSectionProps {
  eyebrow: string;
  eyebrowColor: string;
  title: React.ReactNode;
  desc: string;
  href: string;
  ctaLabel: string;
  bgGradient: string;
  accentColor: string;
  bullets?: string[];
  icon: React.ComponentType<{ className?: string }>;
}

function CompactSection({
  eyebrow,
  eyebrowColor,
  title,
  desc,
  href,
  ctaLabel,
  bgGradient,
  accentColor,
  bullets,
  icon: Icon,
}: CompactSectionProps) {
  return (
    <section className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 ${bgGradient}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accentColor} shadow-md`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wider ${eyebrowColor}`}>
            {eyebrow}
          </p>
          <h3 className="mt-1 text-xl font-bold md:text-2xl">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
            {desc}
          </p>
          {bullets && (
            <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={href}
            className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${eyebrowColor} hover:gap-2 transition-all`}
          >
            {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Deep feature grid entries — same source as before ──────────

const CATEGORY_META = {
  intake: { label: "Intake", iconBg: "bg-blue-100 text-blue-700", pill: "bg-blue-50 text-blue-700 border-blue-200" },
  curate: { label: "Curate", iconBg: "bg-emerald-100 text-emerald-700", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  display: { label: "Display", iconBg: "bg-fuchsia-100 text-fuchsia-700", pill: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  plan: { label: "Plan perks", iconBg: "bg-amber-100 text-amber-700", pill: "bg-amber-50 text-amber-700 border-amber-200" },
} as const;

type Category = keyof typeof CATEGORY_META;

const features: Array<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  category: Category;
}> = [
  { icon: Search, title: "Find my proof (auto-search)", desc: "Paste your URL — we scan X, Reddit, LinkedIn, Product Hunt, App Store, G2, Trustpilot and blogs for real customer praise. Free, no signup.", category: "intake" },
  { icon: Link2, title: "Drop the link", desc: "Paste any tweet, LinkedIn post, Reddit comment, blog URL — we pull the quote and author. Credit stays with the original.", category: "intake" },
  { icon: Camera, title: "Screenshot → testimonial (AI)", desc: "Drop a screenshot of any praise — DM, tweet, Slack, WhatsApp, email, App Store review. Claude Vision extracts the quote, author, and source.", category: "intake" },
  { icon: Send, title: "5 collection channels", desc: "Share your form via link, embed script, iframe, email template, or QR code. All submissions land in one inbox.", category: "intake" },
  { icon: Video, title: "Video testimonials", desc: "1 free video on every plan, unlimited on Pro. Upload MP4 or MOV. Plays inline on your wall — converts ~2× better than text.", category: "intake" },
  { icon: Inbox, title: "One-click approval", desc: "Review submissions in a single inbox. Approve, reject, or edit inline. Optimistic UI — no refresh.", category: "curate" },
  { icon: Palette, title: "Full theme control", desc: "Colors, fonts, spacing, border radius. Match your brand exactly, save theme presets across workspaces.", category: "display" },
  { icon: LayoutGrid, title: "5 layouts", desc: "Grid, Masonry, Carousel, List, and Marquee. Pick different layouts for different pages, all from one library.", category: "display" },
  { icon: Code2, title: "One-line embed", desc: "Copy a <script> tag and drop into any HTML. Works on Framer, Webflow, WordPress, Shopify, Next.js, React, Vue.", category: "display" },
  { icon: ShieldCheck, title: "Shadow DOM isolation", desc: "The embed renders inside Shadow DOM, so your site's CSS can't break the widget and its styles can't leak.", category: "display" },
  { icon: MonitorSmartphone, title: "Public Wall of Love URL", desc: "Every workspace gets /w/[id] — a public hosted wall for Instagram bios, email signatures, QR codes. Free forever.", category: "display" },
  { icon: Star, title: "Live Star Badge", desc: "One-line embed for a live G2-style star badge that reflects your real testimonial rating.", category: "display" },
  { icon: Gauge, title: "Wall Score (AI, Pro)", desc: "0–100 audit across 6 dimensions — volume, diversity, video, recency, verification, ratings. Trend graph included.", category: "plan" },
  { icon: MessageSquare, title: "Ask My Wall (AI, Pro)", desc: "AI chatbot for your site that answers visitor questions using only your real testimonials. Never invents.", category: "plan" },
  { icon: Zap, title: "Tweet drafts (AI)", desc: "Every approved testimonial → 3 tweet-length drafts (quote, reaction, callout). One-click compose to X or LinkedIn.", category: "plan" },
  { icon: Heart, title: "Free forever plan", desc: "10 testimonials, 1 widget, grid layout, a hosted wall, and the 8 free tools. No credit card, no expiry.", category: "plan" },
];

// ── Page ────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <LovedByFoundersStrip />

      <main className="flex-1 bg-gradient-to-br from-violet-50/60 via-background to-purple-50/30 py-14 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          {/* ── Hero ────────────────────────────────── */}
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-600/30 bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
              <Sparkles className="h-3 w-3" /> Every way to build a wall
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Four ways in.{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                One Wall of Love
              </span>{" "}
              at the end.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Auto-find praise across the web, drop a link, send a form, or use
              one of our 8 free tools. Whichever door you pick, every real
              customer voice ends up on your public wall.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild className="bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25">
                <TrackedLink cta="features_hero_signup" surface="features" href="/signup?src=features_hero">
                  Show me my wall <ArrowRight className="ml-1 h-4 w-4" />
                </TrackedLink>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <TrackedLink cta="features_hero_demo" surface="features" href="/w/demo">
                  See a sample wall
                </TrackedLink>
              </Button>
            </div>
          </div>

          {/* ── 4 ENTRY PATHS (compact home Sections 1–4) ─────── */}
          <div className="mt-16 grid gap-5 md:grid-cols-2">
            <CompactSection
              eyebrow="Section 1 · Auto-find"
              eyebrowColor="text-violet-700"
              accentColor="bg-gradient-to-br from-violet-600 to-purple-600"
              bgGradient="bg-gradient-to-br from-violet-50 to-purple-50/60 border-violet-200/60"
              icon={Search}
              title={<>Paste your website → we find your praise</>}
              desc="Real-time web search across X, Reddit, Product Hunt, LinkedIn, App Store, G2 and blogs. See what your customers already say — before you send a single form."
              bullets={["Free · No signup", "Real quotes with sources", "20 seconds per search"]}
              href="/tools/find-my-proof"
              ctaLabel="Try find-my-proof"
            />
            <CompactSection
              eyebrow="Section 2 · Drop the link"
              eyebrowColor="text-violet-700"
              accentColor="bg-gradient-to-br from-violet-600 to-fuchsia-600"
              bgGradient="bg-gradient-to-br from-violet-50 to-fuchsia-50/60 border-violet-200/60"
              icon={Link2}
              title={<>Have a specific rave? Paste the URL</>}
              desc="Tweet, LinkedIn post, Reddit comment, blog review, or any URL — we extract the quote, author, and source. Credit stays with the original link."
              bullets={["Tweets & X posts", "LinkedIn posts", "Reddit + blog reviews", "Any public URL"]}
              href="/tools/find-my-proof?mode=import"
              ctaLabel="Paste a link"
            />
            <CompactSection
              eyebrow="Section 3 · Screenshot"
              eyebrowColor="text-rose-700"
              accentColor="bg-gradient-to-br from-rose-500 to-pink-600"
              bgGradient="bg-gradient-to-br from-rose-50 to-pink-50/60 border-rose-200/60"
              icon={Camera}
              title={<>DM, Slack, email — drop the screenshot</>}
              desc="Claude Vision extracts the quote, author, and source from any praise screenshot. Works on DMs, Slack, WhatsApp, email replies, App Store reviews."
              bullets={["1 free screenshot without signup", "3 more after signup (Free)", "Unlimited on Pro"]}
              href="/tools/screenshot-to-testimonial"
              ctaLabel="Try the screenshot tool"
            />
            <CompactSection
              eyebrow="Section 4 · Send a form"
              eyebrowColor="text-emerald-700"
              accentColor="bg-gradient-to-br from-emerald-600 to-teal-600"
              bgGradient="bg-gradient-to-br from-emerald-50 to-teal-50/60 border-emerald-200/60"
              icon={FileText}
              title={<>The classic path — send them a form</>}
              desc="Get a shareable form link the moment you sign up. Send it via email, WhatsApp, DM, QR, or embed it directly. Every submission lands in your inbox."
              bullets={["5 collection channels", "Video, text, star ratings", "One-click approve"]}
              href="/signup?src=features_form_path"
              ctaLabel="Sign up & get my form"
            />
          </div>

          {/* ── PRO AI FEATURES (compact home Section 5) ──── */}
          <section className="mt-16 rounded-3xl border-2 border-violet-200/60 bg-gradient-to-br from-violet-50 via-purple-50/60 to-fuchsia-50/40 p-6 md:p-10">
            <div className="text-center">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                <Sparkles className="h-3 w-3" /> Pro AI · $9/mo
              </div>
              <h2 className="text-3xl font-bold md:text-4xl">Your wall, but smarter.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Three AI features that turn testimonials into insight, tweets,
                and answers — grounded on the real customers you already have.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Gauge className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Wall Score</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  0–100 audit across 6 dimensions — volume, diversity, video,
                  recency, verification, ratings. With trend graph + next
                  actions.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Send className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Tweet drafts</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every quote → 3 drafts (quote / reaction / callout).
                  One-click opens X or LinkedIn compose pre-filled.
                </p>
              </div>
              <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/60 to-background p-5">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Ask My Wall</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI chatbot for your site — visitors ask, answers cite real
                  customers by name. Never invents.
                </p>
              </div>
            </div>
          </section>

          {/* ── 3-STEP FLOW (compact home Ask→Collect→Publish) ── */}
          <section className="mt-16 rounded-3xl border bg-gradient-to-br from-slate-50 via-background to-violet-50/40 p-6 md:p-10">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                How it works
              </p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">
                Ask → Collect → Publish
              </h2>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { n: "1", t: "Ask", body: "Send a form link or paste a public tweet/URL — whichever's faster." },
                { n: "2", t: "Collect", body: "Text, star ratings, video, and screenshots — all in one inbox." },
                { n: "3", t: "Publish", body: "One line of JavaScript embeds the wall anywhere — or share your hosted /w/ URL." },
              ].map((s) => (
                <div key={s.n} className="text-center">
                  <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">
                    {s.n}
                  </div>
                  <h3 className="text-base font-bold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FULL FEATURE GRID ─────────────────────────── */}
          <section id="features" className="mt-16 scroll-mt-20">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                The full list
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Every feature, grouped by what it does.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Intake · Curate · Display · Plan perks. Color-coded so scanners
                can find what they need without reading everything.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const meta = CATEGORY_META[f.category];
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className={`rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${meta.pill.split(" ").find((c) => c.startsWith("border-")) ?? ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconBg}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.pill}`}>
                          {meta.label}
                        </div>
                        <h3 className="mt-1.5 text-base font-bold">{f.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 8 FREE TOOLS (compact home Section 10) ────── */}
          <section className="mt-16 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.04] via-background to-fuchsia-50/40 p-6 md:p-10">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Free tools · No signup
              </p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">
                8 tiny AI tools — one for every place your customers talk.
              </h2>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { slug: "find-my-proof", label: "Find my proof", Icon: Search, isNew: true },
                { slug: "screenshot-to-testimonial", label: "Screenshot → text", Icon: Camera },
                { slug: "praise-tweet-finder", label: "Praise Tweet Finder", Icon: Twitter },
                { slug: "linkedin-recommendation", label: "LinkedIn Recommender", Icon: Linkedin },
                { slug: "testimonial-writer", label: "Testimonial Writer", Icon: Sparkles },
                { slug: "testimonial-card", label: "Testimonial Card", Icon: Palette },
                { slug: "ask-templates", label: "Ask Templates", Icon: Newspaper },
                { slug: "star-badge", label: "Live Star Badge", Icon: Star },
              ].map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="group relative flex items-center gap-2 rounded-xl border bg-white p-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                >
                  {t.isNew && (
                    <span className="absolute right-2 top-2 rounded-full bg-violet-600 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                      New
                    </span>
                  )}
                  <t.Icon className="h-4 w-4 shrink-0 text-violet-600" />
                  <span className="truncate">{t.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </section>

          {/* ── SOURCES STRIP (compact home visual) ───────── */}
          <section className="mt-14 rounded-3xl border bg-gradient-to-br from-background via-violet-50/30 to-background p-6 md:p-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Every corner of the internet we support
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
                <SourceChip icon={Twitter} label="X" />
                <SourceChip icon={Linkedin} label="LinkedIn" />
                <SourceChip icon={MessageSquare} label="Reddit" />
                <SourceChip icon={Trophy} label="Product Hunt" />
                <SourceChip icon={Zap} label="Hacker News" />
                <SourceChip icon={Star} label="App Store" />
                <SourceChip icon={Award} label="G2 · Trustpilot" />
                <SourceChip icon={Newspaper} label="Any blog / URL" />
              </div>
            </div>
          </section>

          {/* ── FINAL CTA + inline signup ─────────────── */}
          <section className="mt-16 rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 p-6 md:p-10">
            <div className="grid gap-6 md:grid-cols-2 md:gap-10">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">
                  Try every feature — free forever.
                </h2>
                <p className="mt-2 text-muted-foreground">
                  30-second setup. 10 testimonials + hosted wall + all 8 tools
                  on the free tier. Upgrade only when you outgrow it.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button size="lg" variant="outline" asChild>
                    <TrackedLink cta="features_try_demo" surface="features" href="/demo">
                      Try the live demo
                    </TrackedLink>
                  </Button>
                  <Button size="lg" variant="ghost" asChild>
                    <TrackedLink cta="features_sample_wall" surface="features" href="/w/demo">
                      See a sample wall
                    </TrackedLink>
                  </Button>
                </div>
              </div>
              <InlineSignup source="features" idPrefix="features" />
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            &larr; Back to home
          </Link>
          <span className="mx-3">·</span>
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function SourceChip({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
