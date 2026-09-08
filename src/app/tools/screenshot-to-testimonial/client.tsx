"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Twitter,
  Linkedin,
  MessageSquare,
  Mail,
  MessageCircle,
  Instagram,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolsHeader } from "@/components/tools-header";
import { ScreenshotDemo } from "@/components/screenshot-demo";
import { compressImageToDataUrl } from "@/lib/image-compress";
import { track } from "@/lib/analytics";

/**
 * Screenshot → Testimonial (public tool page).
 *
 * ─── Anon abuse model ─────────────────────────────────────────────
 * Anonymous visitors NEVER hit the extraction API. Flow:
 *   1. Watch the autoplay <ScreenshotDemo> at the top (three
 *      pre-computed examples cycling — zero API cost).
 *   2. Pick their own file — we render a thumbnail, compress it
 *      client-side, and stash it in sessionStorage as
 *      pending_screenshot. No Claude call yet.
 *   3. Signup wall appears with their file preview + "Sign up
 *      to see the extraction" CTA. Cookie wipes are meaningless
 *      because no API call happens anonymously.
 *   4. After signup, the welcome page detects pending_screenshot,
 *      calls the API server-side (signed-in), and shows the
 *      extracted testimonial as their "first testimonial live"
 *      moment — a stronger emotional payoff than a canned demo.
 *
 * ─── V1 scope ────────────────────────────────────────────────────
 * One file at a time. Multi-upload is post-launch.
 */

const SESSION_KEY_SCREENSHOT = "pending_screenshot";
const MAX_STASH_BYTES = 4.5 * 1024 * 1024; // ~4.5MB base64 (sessionStorage safe)

export function ScreenshotToTestimonialClient() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setErrorMsg(null);
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please pick an image file — PNG, JPEG, WEBP, or GIF.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("Image is too large. Please pick one under 15MB.");
      return;
    }
    track("screenshot_tool_file_picked", {}, { anonymous: true });

    // Read → compress to under ~4.5MB base64 → stash for the
    // welcome page to pick up post-signup.
    let dataUrl: string;
    try {
      dataUrl = await compressImageToDataUrl(file, MAX_STASH_BYTES);
    } catch {
      setErrorMsg("Couldn't read this image. Try another one.");
      return;
    }
    setPreview(dataUrl);
    try {
      sessionStorage.setItem(SESSION_KEY_SCREENSHOT, dataUrl);
    } catch {
      setErrorMsg(
        "Your browser storage is full. Try a smaller image or clear cache.",
      );
      return;
    }
    track("screenshot_tool_signup_wall_shown", {}, { anonymous: true });
  }

  function reset() {
    setPreview(null);
    setErrorMsg(null);
    try {
      sessionStorage.removeItem(SESSION_KEY_SCREENSHOT);
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function goSignup() {
    track(
      "screenshot_tool_signup_clicked",
      { has_preview: !!preview },
      { anonymous: true },
    );
    router.push("/signup?from=screenshot");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
      <ToolsHeader />

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* Hero copy */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-5xl">
            Turn any screenshot into a testimonial.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            DMs, tweets, Slack praise, WhatsApp thank-yous, App Store reviews —
            drop a screenshot and we&apos;ll extract the quote, author, and
            source into a testimonial card.
          </p>
        </div>

        {/* Autoplay demo — always visible at the top so cold visitors
            immediately see what the tool does before they upload
            anything. Zero API cost, three hand-authored examples. */}
        <div className="mx-auto mt-10 max-w-md">
          <ScreenshotDemo />
        </div>

        {/* Divider label */}
        <div className="mt-14 flex items-center justify-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Now try it on your screenshot
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Upload zone / signup wall */}
        <div className="mt-8">
          {!preview && (
            <UploadDropzone
              onFile={handleFile}
              fileInputRef={fileInputRef}
              error={errorMsg}
            />
          )}
          {preview && (
            <SignupWall
              preview={preview}
              onReset={reset}
              onSignup={goSignup}
            />
          )}
        </div>

        {/* Sources strip — signals the breadth of "any screenshot" */}
        <div className="mx-auto mt-16 max-w-3xl">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Works with screenshots from
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Twitter className="h-4 w-4" /> Twitter / X
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Linkedin className="h-4 w-4" /> LinkedIn
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> Slack
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> Discord
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> Email
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Instagram className="h-4 w-4" /> Instagram
            </span>
          </div>
        </div>

        {/* Why this is better */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Any app",
              body: "Twitter, LinkedIn, Slack, WhatsApp, Discord, email, App Store, Reddit — anywhere your customers say nice things.",
            },
            {
              title: "Verbatim extraction",
              body: "We copy the quote exactly — no rewrites, no paraphrasing. What your customer wrote is what lands on your wall.",
            },
            {
              title: "One-click to wall",
              body: "Save straight into your Wall of Love. Every workspace gets a public URL and one-line embed for any site.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5">
              <p className="font-semibold">{f.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Testimoni
          </Link>{" "}
          — the free way to collect, curate, and embed customer proof.
        </p>
      </div>
    </div>
  );
}

/** Upload drop-zone — hero panel for the "no file yet" state. */
function UploadDropzone({
  onFile,
  fileInputRef,
  error,
}: {
  onFile: (f: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  error: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <>
      <label
        htmlFor="stt-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={`block cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-colors md:p-14 ${
          dragging
            ? "border-primary bg-primary/10"
            : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
        }`}
      >
        <input
          ref={fileInputRef}
          id="stt-file"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <p className="mt-4 text-lg font-semibold">
          Drop your screenshot or click to upload
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          PNG, JPEG, WEBP, or GIF · up to 15MB · one file at a time
        </p>
      </label>
      {error && (
        <p className="mt-3 text-center text-sm text-destructive">{error}</p>
      )}
    </>
  );
}

/**
 * The signup-gate panel that replaces the dropzone once a user has
 * picked a file. Shows their screenshot preview + a big CTA to
 * sign up, framed as "your extraction is queued and waiting for
 * you post-signup." Honest — the user knows what they get for
 * signing up: the extraction runs on THEIR file, and the result
 * appears on their welcome screen automatically.
 */
function SignupWall({
  preview,
  onReset,
  onSignup,
}: {
  preview: string;
  onReset: () => void;
  onSignup: () => void;
}) {
  return (
    <div className="rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-lg md:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
        {/* Uploaded preview */}
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <Check className="h-3.5 w-3.5" /> Screenshot uploaded
          </div>
          <div className="overflow-hidden rounded-2xl border-2 bg-background shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Your uploaded screenshot"
              className="max-h-72 w-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onReset}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Pick a different screenshot
          </button>
        </div>

        {/* CTA */}
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Ready to extract
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Sign up (free) to see your extraction.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Takes 10 seconds. We&apos;ll extract the quote, author, and source
            from your screenshot the moment you land on your dashboard — no
            extra clicks.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>3 free screenshot extractions with signup</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Save straight into a hosted Wall of Love URL</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>One-line embed for your site — Framer, Webflow, React, WordPress</span>
            </li>
          </ul>
          <Button
            size="lg"
            onClick={onSignup}
            className="mt-6 w-full gap-2 shadow-lg"
          >
            Sign up free & see my extraction <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            No credit card. Unlimited extractions on Pro ($9/mo).
          </p>
        </div>
      </div>
    </div>
  );
}

