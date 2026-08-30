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
import { TweetPreviewDemo } from "@/components/tweet-preview-demo";
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
  Loader2,
} from "lucide-react";

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

export default function DemoClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [layout, setLayout] = useState("grid");
  const [theme, setTheme] = useState(THEMES[0]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(SEED_TESTIMONIALS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [demoApproveCount, setDemoApproveCount] = useState(0);
  const [showKeepCallout, setShowKeepCallout] = useState(false);

  // Inline signup form state — shown inside the "Want to keep this?"
  // callout after the user approves a testimonial.
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleInlineSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSignupError(null);
    if (!signupEmail || signupPassword.length < 8) {
      setSignupError("Enter an email and a password of at least 8 characters.");
      return;
    }
    setSignupLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent("/dashboard/welcome")}`,
        },
      });
      if (authError) {
        setSignupError(authError.message);
        return;
      }
      // Whether Supabase issued a session or is emailing a verification
      // link, land the user on /dashboard/welcome — middleware bounces
      // to /login if verification is required and they aren't confirmed yet.
      window.location.assign("/dashboard/welcome?src=demo");
    } catch {
      setSignupError("Something went wrong. Try again or use the signup page.");
    } finally {
      setSignupLoading(false);
    }
  }

  async function handleInlineGoogle() {
    setSignupError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent("/dashboard/welcome?src=demo")}`,
        },
      });
      if (authError) {
        setSignupError(authError.message);
        setGoogleLoading(false);
      }
    } catch {
      setSignupError("Something went wrong. Try again or use the signup page.");
      setGoogleLoading(false);
    }
  }

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
            <Badge variant="secondary" className="hidden sm:flex">Interactive Demo</Badge>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <TrackedLink cta="demo_nav_login" surface="demo" href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </TrackedLink>
                <TrackedLink cta="demo_nav_signup" surface="demo" href="/signup">
                  <Button size="sm">Get Started Free</Button>
                </TrackedLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12">
        {/* Hero */}
        <div className="text-center">
          <Badge variant="outline" className="mb-4">
            <MousePointerClick className="mr-1 h-3 w-3" />
            Try the flow. Save it to an account when you want it on your site.
          </Badge>
          <h1 className="text-4xl font-bold md:text-5xl">
            Paste a tweet, or fill a form.{" "}
            <span className="text-primary">See it live in 30 seconds.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            The two intake paths, both interactive. Try the form flow below,
            or scroll down to paste any X or LinkedIn URL and see the same
            testimonial land in your library.
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
            Two ways in. Paste an existing tweet — instant. Or share a form
            for fresh submissions. Both flows below are live.
          </p>

          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-8">
            {/* LEFT: Paste-a-tweet flow */}
            <div className="flex flex-col">
              <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Auto-approved · Skips step 2 →
              </div>
              <div className="flex-1">
                <TweetPreviewDemo />
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
                  <li>✓ 5-minute setup, cancel anytime</li>
                </ul>
              </div>

              {/* Right — inline signup form */}
              <div className="rounded-xl border bg-background p-5 shadow-sm">
                <form onSubmit={handleInlineSignup} className="space-y-3">
                  <div>
                    <Label htmlFor="demo-signup-email" className="text-xs">
                      Email
                    </Label>
                    <Input
                      id="demo-signup-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={signupLoading || googleLoading}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="demo-signup-password" className="text-xs">
                      Password
                    </Label>
                    <Input
                      id="demo-signup-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="At least 8 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={signupLoading || googleLoading}
                      className="mt-1"
                    />
                  </div>

                  {signupError && (
                    <p className="text-xs text-destructive" role="alert">
                      {signupError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={signupLoading || googleLoading}
                  >
                    {signupLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                      </>
                    ) : (
                      <>
                        Create free account <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-background px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleInlineGoogle}
                  disabled={signupLoading || googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  By continuing you agree to our{" "}
                  <Link href="/terms" className="underline">Terms</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline">Privacy Policy</Link>.
                </p>
              </div>
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

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl bg-primary/5 border border-primary/20 p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-3xl font-bold">
            Like what you see?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            You just experienced the full Testimoni flow — collect, approve, display.
            Set it up for your own site in under 5 minutes.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink cta="demo_bottom_signup" surface="demo" href="/signup">
              <Button size="lg" className="gap-2">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TrackedLink>
            <TrackedLink cta="demo_bottom_wall_demo" surface="demo" href="/w/demo">
              <Button size="lg" variant="outline">
                See a Sample Wall
              </Button>
            </TrackedLink>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free forever plan. No credit card required.
          </p>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="font-semibold">Testimoni</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/w/demo" className="text-muted-foreground hover:text-foreground">Sample Wall</Link>
            <Link href="/demo" className="text-muted-foreground hover:text-foreground">Demo</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>
          <p className="text-sm text-muted-foreground">&copy; 2026 Testimoni.</p>
        </div>
      </footer>
    </div>
  );
}
