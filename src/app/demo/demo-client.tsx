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
  const [step, setStep] = useState<"form" | "submitted">("form");

  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRating, setFormRating] = useState(5);

  const widgetRef = useRef<HTMLDivElement>(null);
  const inboxRef = useRef<HTMLDivElement>(null);

  const ctaHref = isLoggedIn ? "/dashboard" : "/signup";
  const ctaLabel = isLoggedIn ? "Go to Dashboard" : "Get Started Free";
  const approvedTestimonials = testimonials.filter((t) => t.isApproved);
  const widgetTestimonials = approvedTestimonials.filter((t) => t.inWidget);
  const curateRef = useRef<HTMLDivElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim()) return;

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
    setTestimonials((prev) =>
      prev.map((t, i) => (i === index ? { ...t, isApproved: true, isNew: false } : t))
    );
    setTimeout(() => {
      curateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }

  function rejectTestimonial(index: number) {
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
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started Free</Button>
                </Link>
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
            Try it yourself — no signup needed
          </Badge>
          <h1 className="text-4xl font-bold md:text-5xl">
            Submit a testimonial.<br />
            <span className="text-primary">Watch it appear instantly.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            This is exactly what your customers experience. Fill out the form
            below, then see your testimonial show up in the live widget.
          </p>
        </div>

        {/* Step 0: How customers reach the form */}
        <div className="mt-12">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              0
            </div>
            <h2 className="text-lg font-semibold">
              First — how does a customer reach this form?
            </h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            You never send them to Testimoni. You share the form through 5 channels from your dashboard:
          </p>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Share link", detail: "Paste in emails, DMs, socials" },
                { label: "Embed script", detail: "Floating button on your site" },
                { label: "iFrame", detail: "Full form on a page you host" },
                { label: "Email template", detail: "Send after a purchase" },
                { label: "QR code", detail: "Print on receipts, packaging" },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-lg border bg-background px-3 py-2 text-xs"
                >
                  <div className="font-semibold">{c.label}</div>
                  <div className="mt-0.5 text-muted-foreground">{c.detail}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              For this demo, pretend you just clicked one — the form below is what your customer would see. ↓
            </p>
          </div>
        </div>

        {/* Two-column layout: Form + Arrow + Widget */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* LEFT: Collection Form */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <h2 className="text-lg font-semibold">Your customer fills this form</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              You share a link. They click it and see this. Try it now:
            </p>

            <div className="rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-sm">
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
                    Your testimonial has been submitted. It&apos;s waiting for approval in the inbox on the right.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                    <ArrowRight className="h-5 w-5" />
                    <span className="text-sm font-medium">Now approve it in the Inbox →</span>
                  </div>
                  <Button variant="outline" className="mt-4" onClick={resetForm}>
                    Submit another
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: What you (the business) see */}
          <div ref={inboxRef}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <h2 className="text-lg font-semibold">You approve it in your dashboard</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              New submissions appear here. Click <strong>Approve</strong> to publish, or <strong>Reject</strong> to hide it — approved ones flow into the widget below.
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
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Inbox is empty. Submit a testimonial on the left to see it appear here.
                  </p>
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
                    + {testimonials.filter((t) => t.isApproved).length} already approved. Curate them below ↓
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Curate widget — pick which approved testimonials go in your widget */}
        <div className="mt-16" ref={curateRef}>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <h2 className="text-lg font-semibold">Pick which testimonials go in your widget</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Approved testimonials are your <strong>library</strong>. Click any card to add it to the widget or remove it — you might not want to show every one on every page.
          </p>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
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
                Approve testimonials in the Inbox above to add them here.
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
        </div>

        {/* Step 4: Live Widget */}
        <div className="mt-16" ref={widgetRef}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
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
            <Link href={ctaHref}>
              <Button size="lg" className="gap-2">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
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
            <Link href="/demo" className="text-muted-foreground hover:text-foreground">Demo</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>
          <p className="text-sm text-muted-foreground">&copy; 2024 Testimoni.</p>
        </div>
      </footer>
    </div>
  );
}
