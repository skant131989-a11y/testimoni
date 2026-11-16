"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LetterAvatar } from "@/components/letter-avatar";
import { TrackedLink } from "@/components/tracked-link";
import { LovedByFoundersStrip } from "@/components/loved-by-founders-strip";
import { InlineSignup } from "@/components/inline-signup";
import { HeroDualDemo } from "@/components/hero-dual-demo";
import { DemoVideo } from "@/components/demo-video";
import { LaunchBar } from "@/components/launch-bar";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  Star,
  LayoutGrid,
  Columns3,
  GalleryHorizontal,
  List,
  MoveHorizontal,
  ArrowRight,
  ArrowDown,
  Send,
  Sparkles,
  CheckCircle2,
  Eye,
  MousePointerClick,
  Palette,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";

interface Testimonial {
  customerName: string;
  customerTitle: string;
  customerAvatar: string;
  content: string;
  rating: number;
  isNew?: boolean;
  isApproved?: boolean;
  inWidget?: boolean;
}

const SEED_TESTIMONIALS: Testimonial[] = [
  // Already approved AND added to the widget — visible immediately
  {
    customerName: "Sarah Chen",
    customerTitle: "CEO at LaunchPad",
    customerAvatar: "https://i.pravatar.cc/150?img=1",
    content:
      "Testimoni transformed our landing page. We saw a 34% increase in conversions within the first week. Setup took less than 5 minutes.",
    rating: 5,
    isApproved: true,
    inWidget: true,
  },
  {
    customerName: "Marcus Johnson",
    customerTitle: "Course Creator",
    customerAvatar: "https://i.pravatar.cc/150?img=3",
    content:
      "My students love leaving video testimonials. It adds so much authenticity compared to plain text. The embed looks beautiful on my site.",
    rating: 5,
    isApproved: true,
    inWidget: true,
  },
  // Approved but NOT in the widget — user can add it
  {
    customerName: "Emily Rodriguez",
    customerTitle: "Marketing Lead at Flowbase",
    customerAvatar: "https://i.pravatar.cc/150?img=5",
    content:
      "We switched from manually updating our testimonials page to Testimoni. Customers submit directly, we approve the best ones. Huge time saver.",
    rating: 5,
    isApproved: true,
    inWidget: false,
  },
  {
    customerName: "David Park",
    customerTitle: "Founder at ShipFast",
    customerAvatar: "https://i.pravatar.cc/150?img=8",
    content:
      "The masonry layout is gorgeous. Our wall of love went from amateur to looking like a $10M ARR SaaS. Worth every penny.",
    rating: 5,
    isApproved: true,
    inWidget: false,
  },
  // Pending — in inbox, awaiting approval
  {
    customerName: "Priya Sharma",
    customerTitle: "Product Manager at Nova",
    customerAvatar: "https://i.pravatar.cc/150?img=47",
    content:
      "Onboarding was ridiculously fast. Had our first testimonial widget live within 10 minutes of signing up.",
    rating: 5,
    isApproved: false,
    inWidget: false,
  },
  {
    customerName: "Alex Kumar",
    customerTitle: "Indie Hacker",
    customerAvatar: "https://i.pravatar.cc/150?img=12",
    content:
      "Cheapest testimonial tool I've tried and the widget looks the best. Not even close.",
    rating: 4,
    isApproved: false,
    inWidget: false,
  },
];

const LAYOUTS = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "masonry", label: "Masonry", icon: Columns3 },
  { id: "carousel", label: "Carousel", icon: GalleryHorizontal },
  { id: "list", label: "List", icon: List },
  { id: "marquee", label: "Marquee", icon: MoveHorizontal },
];

const THEMES = [
  { id: "light", label: "Light", bg: "#ffffff", text: "#1a1a1a", border: "#e5e7eb" },
  { id: "dark", label: "Dark", bg: "#1a1a2e", text: "#e5e7eb", border: "#2d2d44" },
  { id: "warm", label: "Warm", bg: "#fdf6ee", text: "#3d2c1e", border: "#e8d5c0" },
  { id: "brand", label: "Purple", bg: "#f5f0ff", text: "#2d1b69", border: "#d4c4f0" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function StarInput({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              i <= (hover || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function TestimonialCard({
  t,
  theme,
}: {
  t: Testimonial;
  theme: (typeof THEMES)[0];
}) {
  return (
    <div
      className={`rounded-xl p-5 transition-all hover:shadow-lg ${t.isNew ? "ring-2 ring-primary ring-offset-2" : ""}`}
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
      }}
    >
      {t.isNew && (
        <div className="mb-2 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium text-primary">Just added!</span>
        </div>
      )}
      <StarRating rating={t.rating} />
      <p className="mt-3 text-sm leading-relaxed" style={{ color: theme.text }}>
        &ldquo;{t.content}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <LetterAvatar name={t.customerName} size={40} />
        <div>
          <p className="text-sm font-semibold" style={{ color: theme.text }}>
            {t.customerName}
          </p>
          <p className="text-xs opacity-60">{t.customerTitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function DemoClient() {
  // Client-side auth check — falls back to anonymous state until we
  // know for sure. Keeps this route statically pre-renderable at
  // build time.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setIsLoggedIn(!!data.user);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const [layout, setLayout] = useState("grid");
  const [theme, setTheme] = useState(THEMES[0]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(SEED_TESTIMONIALS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [demoApproveCount, setDemoApproveCount] = useState(0);
  const [showKeepCallout, setShowKeepCallout] = useState(false);

  const [step, setStep] = useState<"form" | "submitted">("form");

  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRating, setFormRating] = useState(5);

  const widgetRef = useRef<HTMLDivElement>(null);
  const keepCalloutRef = useRef<HTMLDivElement>(null);
  const inboxRef = useRef<HTMLDivElement>(null);

  const ctaHref = isLoggedIn ? "/dashboard" : "/signup";
  const ctaLabel = isLoggedIn ? "Go to Dashboard" : "Get Started Free";
  const approvedTestimonials = testimonials.filter((t) => t.isApproved);
  const widgetTestimonials = approvedTestimonials.filter((t) => t.inWidget);
  const curateRef = useRef<HTMLDivElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim()) return;

    track("demo_form_submitted", { rating: formRating });

    const newTestimonial: Testimonial = {
      customerName: formName,
      customerTitle: formTitle || "Happy Customer",
      customerAvatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(formName)}`,
      content: formContent,
      rating: formRating,
      isNew: true,
      isApproved: false, // Pending until user clicks Approve
    };

    setTestimonials((prev) => {
      const updated = prev.map((t) => ({ ...t, isNew: false }));
      return [newTestimonial, ...updated];
    });

    setStep("submitted");

    setTimeout(() => {
      inboxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }

  function approveTestimonial(index: number) {
    track("demo_testimonial_approved", { position: index });
    // Auto-add on approve — the testimonial goes straight into the widget
    // so users see it live on their wall the moment they approve.
    setTestimonials((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, isApproved: true, inWidget: true, isNew: false } : t
      )
    );
    setDemoApproveCount((c) => c + 1);
    setTimeout(() => {
      widgetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    // Delay the "Want to keep this?" callout by ~3s so the user has
    // real time to look at their testimonial in the widget preview and
    // register that the loop closed — otherwise the CTA hijacks the
    // moment before it lands. Then scroll it into view so the whole
    // signup form is visible.
    setTimeout(() => {
      setShowKeepCallout(true);
      setTimeout(() => {
        keepCalloutRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }, 3000);
  }

  function rejectTestimonial(index: number) {
    track("demo_testimonial_rejected", { position: index });
    setTestimonials((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleInWidget(index: number) {
    setTestimonials((prev) =>
      prev.map((t, i) => (i === index ? { ...t, inWidget: !t.inWidget } : t))
    );
    setTimeout(() => {
      widgetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }

  function resetForm() {
    setFormName("");
    setFormTitle("");
    setFormContent("");
    setFormRating(5);
    setStep("form");
  }

  return (
    <div className="min-h-screen bg-background">
      <LaunchBar
        id="ask-my-wall-2026-09"
        href="/#new-ai-features"
        message="Ask My Wall is live — an AI chatbot that only quotes real customers."
        cta="See it"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={28}
              height={28}
              className="rounded-full"
              priority
            />
            <span className="text-xl font-bold">Testimoni</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Standardized nav to match /w/demo + /tools/* + home:
                Live Demo · Free Tools · Pricing · [CTA].
                Rendered UNCONDITIONALLY (was previously gated by
                !isLoggedIn, which meant logged-in visitors saw only
                the Dashboard button and no nav links at all — no
                way back to Free Tools or Pricing without hitting the
                logo). Home page never hid these; parity restored. */}
            <div className="hidden items-center gap-5 md:flex">
              <TrackedLink cta="demo_nav_live_demo" surface="demo" href="/demo" className="text-sm font-medium text-primary hover:underline">
                Live Demo
              </TrackedLink>
              <TrackedLink cta="demo_nav_tools" surface="demo" href="/tools" className="text-sm text-muted-foreground hover:text-foreground">
                Free Tools
              </TrackedLink>
              <TrackedLink cta="demo_nav_pricing" surface="demo" href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                Pricing
              </TrackedLink>
            </div>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                {/* Log in — desktop only. Cold-visitor page: keep the
                    header focused on the primary CTA on small screens. */}
                <TrackedLink cta="demo_nav_login" surface="demo" href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">Log in</Button>
                </TrackedLink>
                <TrackedLink cta="demo_nav_signup" surface="demo" href="/signup">
                  <Button size="sm">
                    <span className="sm:hidden">Start free</span>
                    <span className="hidden sm:inline">Get Started Free</span>
                  </Button>
                </TrackedLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Loved-by-founders strip — placed right below the demo's own
          header. Same position as on /pricing: nav → strip → hero.
          Grounds the demo experience in real founder proof before
          the visitor starts clicking through the mock flow. */}
      <LovedByFoundersStrip />

      <main className="mx-auto max-w-7xl px-4 py-12">
        {/* Banner — surfaces the Screenshot → Testimonial tool as a
            skip-the-flow alternative for visitors who already have
            praise to import. Compact, one line, links directly to
            the free tool page. */}
        <div className="mb-8 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/[0.03] to-transparent p-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Already have praise in your DMs, tweets, or Slack?
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Skip the flow — drop a screenshot and we&apos;ll extract it
                  into a testimonial in 3 seconds.
                </p>
              </div>
            </div>
            <TrackedLink
              cta="demo_screenshot_banner"
              surface="demo"
              href="/tools/screenshot-to-testimonial"
              className="shrink-0"
            >
              <Button size="sm" variant="outline" className="gap-1.5">
                Try Screenshot → Testimonial <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </TrackedLink>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center">
          <Badge variant="outline" className="mb-4">
            <MousePointerClick className="mr-1 h-3 w-3" />
            Try the flow. Save it to an account when you want it on your site.
          </Badge>
          <h1 className="text-4xl font-bold md:text-5xl">
            Paste a tweet, drop a screenshot, or fill a form.{" "}
            <span className="text-primary">See it live in 30 seconds.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Nothing to sign up for. Add a testimonial below, approve it, and
            watch it appear on a live widget.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Prefer a shareable link over embed code?{" "}
            <TrackedLink cta="demo_hero_wall_demo" surface="demo" href="/w/demo" className="font-medium text-primary hover:underline">
              See a hosted Sample Wall →
            </TrackedLink>
          </p>
        </div>

        {/* STEP 1: Two intake paths — tweet-paste OR form — side by side
            with an OR divider. Both are interactive; both land in the same
            testimonial library after signup. */}
        <div className="mt-12">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <h2 className="text-lg font-semibold">Choose an intake path</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Try the left side (paste a tweet or drop a screenshot) or the
            right side (the form your customers would fill in).
          </p>

          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-8">
            {/* LEFT: Instant-intake tabs — paste-a-tweet OR screenshot.
                Both skip Step 2 (auto-approved on the demo). See
                <HeroDualDemo> for the tab wrapper. */}
            <div className="flex flex-col">
              <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Auto-approved · Skips step 2 →
              </div>
              <div className="flex-1">
                <HeroDualDemo />
              </div>
            </div>

            {/* OR divider */}
            <div className="relative flex items-center justify-center md:my-0">
              <div className="absolute inset-0 flex items-center md:hidden" aria-hidden="true">
                <div className="h-px w-full border-t border-dashed" />
              </div>
              <div className="absolute inset-y-0 hidden items-center md:flex" aria-hidden="true">
                <div className="h-full w-px border-l border-dashed" />
              </div>
              <span className="relative rounded-full border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                or
              </span>
            </div>

            {/* RIGHT: Collection form flow */}
            <div className="flex flex-col" ref={inboxRef}>
              <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-muted-foreground/30 bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Needs your approval below ↓
              </div>
              <div className="flex-1 rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-sm">
                <div className="mb-6 text-center">
                  <Image
                    src="/icon.png"
                    alt="Testimoni logo"
                    width={48}
                    height={48}
                    className="mx-auto mb-3 rounded-full"
                  />
                  <h3 className="text-xl font-bold">Share your experience</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We&apos;d love to hear what you think!
                  </p>
                </div>

                {step === "form" ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Rating</Label>
                      <div className="mt-1">
                        <StarInput rating={formRating} onChange={setFormRating} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="demo-content">Your testimonial *</Label>
                      <Textarea
                        id="demo-content"
                        placeholder="What did you love about working with us?"
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        rows={3}
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="demo-name">Your name *</Label>
                        <Input
                          id="demo-name"
                          placeholder="Jane Smith"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="demo-title">Title / Company</Label>
                        <Input
                          id="demo-title"
                          placeholder="CEO at Acme"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full gap-2" size="lg">
                      <Send className="h-4 w-4" />
                      Submit Testimonial
                    </Button>
                  </form>
                ) : (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                    <h3 className="mt-4 text-xl font-bold">Thank you!</h3>
                    <p className="mt-2 text-muted-foreground">
                      Your testimonial has been submitted. It&apos;s waiting
                      for approval in step 2 below.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                      <ArrowRight className="h-5 w-5" />
                      <span className="text-sm font-medium">Approve it below ↓</span>
                    </div>
                    <Button variant="outline" className="mt-4" onClick={resetForm}>
                      Submit another
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bridge sentence between step 1 and step 2 — makes the workflow
              difference explicit. */}
          <p className="mt-8 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Form submissions</span> land in your inbox for one-click approval.{" "}
            <span className="font-medium text-foreground">Tweet imports</span> skip straight to your library — you already vetted them by picking the URL.
          </p>
        </div>

        {/* STEP 2: Approve — full-width section. Shows the inbox with
            pending items from the form path; empty state explains why
            it's empty (either nothing submitted yet, or only the tweet
            path was used). */}
        <div className="mt-16">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <h2 className="text-lg font-semibold">Approve form submissions</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            New form submissions appear here. Click <strong>Approve</strong> to
            publish, or <strong>Reject</strong> to hide. Tweet imports skip
            this step entirely.
          </p>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                INBOX &middot; PENDING
              </h3>
              <Badge variant={testimonials.some((t) => !t.isApproved) ? "default" : "secondary"}>
                {testimonials.filter((t) => !t.isApproved).length} pending
              </Badge>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {testimonials.filter((t) => !t.isApproved).length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Inbox is empty.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submit the form above to see a pending item here — or if
                    you used the tweet path, this step is skipped by design.
                  </p>
                </div>
              ) : (
                testimonials
                  .map((t, i) => ({ t, i }))
                  .filter(({ t }) => !t.isApproved)
                  .map(({ t, i }) => (
                    <div
                      key={`${t.customerName}-${i}`}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
                        t.isNew ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <LetterAvatar name={t.customerName} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{t.customerName}</span>
                          {t.isNew && <Badge className="text-[10px] px-1.5 py-0">New</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                        <div className="mt-1 flex gap-0.5">
                          {Array.from({ length: t.rating }).map((_, j) => (
                            <Star key={j} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={() => approveTestimonial(i)}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => rejectTestimonial(i)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
              )}
              {testimonials.some((t) => t.isApproved) && (
                <div className="pt-2 text-center text-xs text-muted-foreground">
                  + {testimonials.filter((t) => t.isApproved).length} already approved. Live on your wall ↓
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Live Widget */}
        <div className="mt-16" ref={widgetRef}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <h2 className="text-lg font-semibold">It appears on your website automatically</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Choose a layout and theme. This is what visitors to your site see.
          </p>

          {/* Controls */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {LAYOUTS.map((l) => {
                const Icon = l.icon;
                return (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      layout === l.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {l.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    theme.id === t.id ? "scale-110 border-primary" : "border-transparent"
                  }`}
                  style={{ backgroundColor: t.bg }}
                  title={t.label}
                />
              ))}
            </div>
          </div>

          {/* Widget Area */}
          <div
            className="rounded-2xl p-8 transition-colors"
            style={{ backgroundColor: theme.bg === "#ffffff" ? "#f9fafb" : theme.bg + "33" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Live widget preview — {layout} · {widgetTestimonials.length} in widget
              </span>
            </div>

            {widgetTestimonials.length === 0 && (
              <div className="rounded-xl border border-dashed border-muted-foreground/30 py-12 text-center text-sm text-muted-foreground">
                No testimonials in the widget yet.<br />
                Add some from the library above to see them here.
              </div>
            )}

            {widgetTestimonials.length > 0 && (
              <>
            {/* Grid */}
            {layout === "grid" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {widgetTestimonials.map((t, i) => (
                  <TestimonialCard key={`${t.customerName}-${i}`} t={t} theme={theme} />
                ))}
              </div>
            )}

            {/* Masonry */}
            {layout === "masonry" && (
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {widgetTestimonials.map((t, i) => (
                  <div key={`${t.customerName}-${i}`} className="mb-4 break-inside-avoid">
                    <TestimonialCard t={t} theme={theme} />
                  </div>
                ))}
              </div>
            )}

            {/* Carousel */}
            {layout === "carousel" && (
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                  {widgetTestimonials.map((t, i) => (
                    <div
                      key={`${t.customerName}-${i}`}
                      className="min-w-[300px] max-w-[300px] flex-shrink-0 snap-start"
                    >
                      <TestimonialCard t={t} theme={theme} />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  ← Scroll to see more →
                </p>
              </div>
            )}

            {/* List */}
            {layout === "list" && (
              <div className="mx-auto max-w-2xl space-y-4">
                {widgetTestimonials.map((t, i) => (
                  <TestimonialCard key={`${t.customerName}-${i}`} t={t} theme={theme} />
                ))}
              </div>
            )}

            {/* Marquee */}
            {layout === "marquee" && (
              <div className="overflow-hidden">
                <div className="flex gap-4 animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
                  {[...widgetTestimonials, ...widgetTestimonials].map((t, i) => (
                    <div
                      key={`${t.customerName}-${i}`}
                      className="min-w-[300px] max-w-[300px] flex-shrink-0"
                    >
                      <TestimonialCard t={t} theme={theme} />
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>

        {/* "Want to keep this?" callout — appears 1.5s after the user
            approves a testimonial, giving them time to actually see the
            widget update above first. Slides up + fades in so it doesn't
            feel abrupt. Inline signup so the aha moment converts directly
            without a page navigation. */}
        {showKeepCallout && demoApproveCount > 0 && (
          <div
            ref={keepCalloutRef}
            className="mt-12 rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 md:p-8"
            style={{ animation: "demoKeepIn 500ms ease-out" }}
          >
            <style>{`
              @keyframes demoKeepIn {
                from { opacity: 0; transform: translateY(14px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:gap-8">
              {/* Left — the pitch */}
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3 w-3" /> That&apos;s your testimonial, live ↑
                </div>
                <p className="text-2xl font-bold">Want to keep this?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create a free account and this same flow lives at your own
                  Wall of Love URL — sharable in your Instagram bio, email
                  signature, or embedded on any site with one line of code.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <li>✓ Free forever plan · no credit card</li>
                  <li>✓ Public wall URL you can share today</li>
                  <li>✓ 30-second setup, cancel anytime</li>
                </ul>
              </div>

              {/* Right: same signup card as the rest of the site (email code or Google) */}
              <InlineSignup source="demo_keep" idPrefix="demo-keep" />
            </div>
          </div>
        )}

        {/* The magic line */}
        <div className="mt-12 rounded-xl border bg-card p-6">
          <h3 className="font-semibold">All of this from one line of code</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste this on your website. Your testimonials update automatically when you approve new ones.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            <code>{`<script src="https://testimoni.io/embed/widget.js" data-widget-id="your-id" async></script>`}</code>
          </pre>
        </div>

        {/* Hosted wall alternative — highest-context CTA */}
        <TrackedLink
          cta="demo_hosted_wall_card"
          surface="demo"
          href="/w/demo"
          className="mt-6 flex items-start gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6 transition-colors hover:bg-primary/10"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-2xl">
            💜
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              Not ready to embed? Share a hosted wall instead.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Every widget also has a public URL you can drop in your
              Instagram bio, email signature, or WhatsApp status. Zero code.
            </p>
            <p className="mt-2 text-sm font-semibold text-primary">
              See a Sample Wall →
            </p>
          </div>
        </TrackedLink>

        {/* Advanced (Pro): curate per widget — collapsed by default so it
            doesn't interrupt the primary Free-plan flow above. */}
        <div className="mt-16" ref={curateRef}>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                ✨
              </div>
              <div>
                <p className="font-semibold">
                  Advanced: curate per widget{" "}
                  <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Pro
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Show different testimonials on different pages — homepage,
                  pricing, product. Click to see how.
                </p>
              </div>
            </div>
            <span className="text-xl text-muted-foreground">
              {showAdvanced ? "−" : "+"}
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-4 text-sm text-muted-foreground">
                On Free, every approved testimonial lands on your one widget
                automatically. On Pro, you can build unlimited widgets and
                toggle each testimonial in or out of each one:
              </p>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  APPROVED LIBRARY
                </h3>
                <Badge>
                  {widgetTestimonials.length} of {approvedTestimonials.length} in widget
                </Badge>
              </div>

              {approvedTestimonials.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Approve testimonials in the Inbox above to see them here.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {testimonials
                    .map((t, i) => ({ t, i }))
                    .filter(({ t }) => t.isApproved)
                    .map(({ t, i }) => {
                      const inWidget = !!t.inWidget;
                      return (
                        <button
                          key={`curate-${t.customerName}-${i}`}
                          onClick={() => toggleInWidget(i)}
                          className={`group relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
                            inWidget
                              ? "border-primary bg-primary/5"
                              : "border-dashed border-muted-foreground/30 bg-muted/30 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <LetterAvatar name={t.customerName} size={36} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{t.customerName}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {t.content}
                            </p>
                            <div className="mt-1 flex gap-0.5">
                              {Array.from({ length: t.rating }).map((_, j) => (
                                <Star key={j} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <div
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                              inWidget
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground border"
                            }`}
                          >
                            {inWidget ? "✓ In widget" : "+ Add"}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full-loop demo video — placed after the interactive demo so
            the user has already felt the flow. Reinforces "here's the
            whole 30s loop" right before the sign-up CTA below. */}
        <DemoVideo
          surface="demo"
          title="You just tried the form path. Here's the full 30-second loop."
          caption="Paste a tweet → live testimonial on your wall. That's it."
        />

        {/* Bottom CTA — matches home + /w/demo: inline signup form
            beside the pitch. Replaces the older button-only version so
            visitors can convert without a page hop. */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            <div>
              <Sparkles className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-3xl font-bold">
                Like what you see?
              </h2>
              <p className="mt-3 text-muted-foreground">
                You just experienced the full Testimoni flow — collect,
                approve, display. Set it up for your own site in under 30
                seconds.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li>✓ 15 testimonials, 1 form, 1 widget on the Free plan</li>
                <li>✓ Public Wall of Love URL — shareable anywhere</li>
                <li>✓ One-line embed for any site</li>
              </ul>
              {/* Escape hatch — free tools first for the curious-but-
                  not-committed visitor. Mirrors the /w/demo pattern. */}
              <p className="mt-6 text-sm text-muted-foreground">
                Not ready?{" "}
                <TrackedLink
                  cta="demo_try_tools"
                  surface="demo"
                  href="/tools"
                  className="font-medium text-primary hover:underline"
                >
                  Try our free tools first →
                </TrackedLink>
                {" · "}
                <TrackedLink
                  cta="demo_bottom_wall_demo"
                  surface="demo"
                  href="/w/demo"
                  className="font-medium text-primary hover:underline"
                >
                  or see a sample wall →
                </TrackedLink>
              </p>
            </div>
            <InlineSignup source="demo_bottom" idPrefix="demo-bottom" />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
