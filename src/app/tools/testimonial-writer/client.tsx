"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";

/**
 * Public testimonial writer tool. Calls /api/tools/generate-testimonial
 * which currently returns template-driven mock text — swap that route
 * for a real LLM later without touching this component.
 */

const FEELINGS = [
  { id: "impressed", label: "Impressed by the work" },
  { id: "grateful", label: "Grateful for the help" },
  { id: "transformed", label: "Transformed how I work" },
  { id: "saved_time", label: "Saved me time" },
  { id: "saved_money", label: "Saved me money" },
] as const;

const TONES = [
  { id: "casual", label: "Casual" },
  { id: "professional", label: "Professional" },
  { id: "enthusiastic", label: "Enthusiastic" },
] as const;

const LENGTHS = [
  { id: "short", label: "Short (1 sentence)" },
  { id: "medium", label: "Medium (2-3 sentences)" },
  { id: "long", label: "Long (4+ sentences)" },
] as const;

interface Variant {
  angle: string;
  text: string;
}

export function TestimonialWriterClient() {
  const [reviewingName, setReviewingName] = useState("");
  const [didWhat, setDidWhat] = useState("");
  const [feeling, setFeeling] = useState<typeof FEELINGS[number]["id"]>("impressed");
  const [tone, setTone] = useState<typeof TONES[number]["id"]>("casual");
  const [length, setLength] = useState<typeof LENGTHS[number]["id"]>("medium");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!reviewingName.trim() || !didWhat.trim()) return;
    setLoading(true);
    setError(null);
    track("writer_generate_clicked", { feeling, tone, length });
    try {
      const res = await fetch("/api/tools/generate-testimonial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewingName, didWhat, feeling, tone, length }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate. Try again.");
        return;
      }
      setVariants(data.variants);
      track("writer_variants_shown", { count: data.variants?.length ?? 0 });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyVariant(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    track("writer_variant_copied", { idx });
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  /**
   * Bridge to the product: stash the generated testimonial in
   * sessionStorage and redirect to signup. The welcome page reads
   * pending_tool_testimonial on mount and auto-persists to the
   * user's fresh workspace so they land on the dashboard with
   * this testimonial already saved.
   */
  function saveToWall(text: string) {
    try {
      sessionStorage.setItem(
        "pending_tool_testimonial",
        JSON.stringify({
          content: text,
          customerName: reviewingName.trim(),
          customerTitle: null,
          rating: 5,
          tool: "writer",
        })
      );
    } catch {}
    track("writer_save_to_wall_clicked");
    window.location.assign("/signup?tool=testimonial-writer&intent=save");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={28}
              height={28}
              className="rounded-full"
            />
            <span className="text-xl font-bold">Testimoni</span>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Free · No signup
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Stuck writing a testimonial?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Tell us a name, what they did, and how it made you feel. We&apos;ll
            give you 3 versions to choose from — copy the one that sounds like
            you.
          </p>
        </div>

        {/* Form */}
        <div className="mt-10 space-y-5 rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-6">
          <div>
            <Label htmlFor="who" className="text-sm font-semibold">
              Who are you writing about? *
            </Label>
            <Input
              id="who"
              value={reviewingName}
              onChange={(e) => setReviewingName(e.target.value)}
              placeholder="e.g. Sarah at Acme Studio"
              className="mt-1.5"
              maxLength={80}
            />
          </div>

          <div>
            <Label htmlFor="what" className="text-sm font-semibold">
              What did they do? *
            </Label>
            <Textarea
              id="what"
              value={didWhat}
              onChange={(e) => setDidWhat(e.target.value)}
              placeholder="e.g. redesigned my landing page and doubled my signups"
              rows={3}
              className="mt-1.5"
              maxLength={300}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {didWhat.length}/300 characters
            </p>
          </div>

          <div>
            <Label className="text-sm font-semibold">How did it feel?</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {FEELINGS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFeeling(f.id)}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-medium transition ${
                    feeling === f.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tone" className="text-sm font-semibold">
                Tone
              </Label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as typeof TONES[number]["id"])}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TONES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="length" className="text-sm font-semibold">
                Length
              </Label>
              <select
                id="length"
                value={length}
                onChange={(e) => setLength(e.target.value as typeof LENGTHS[number]["id"])}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {LENGTHS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={loading || !reviewingName.trim() || !didWhat.trim()}
            size="lg"
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Writing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Give me 3 versions
              </>
            )}
          </Button>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Results */}
        {variants && (
          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                3 versions
              </p>
              <button
                type="button"
                onClick={() => {
                  track("writer_regenerate_gated");
                  window.location.assign(
                    "/signup?tool=testimonial-writer&unlock=regenerate"
                  );
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <RefreshCw className="h-3 w-3" /> Regenerate (sign up)
              </button>
            </div>

            {variants.map((v, i) => {
              // First variant free; variants 2 and 3 are shown but
              // blurred behind a signup unlock. Curiosity gap: the
              // user sees the angle labels and length hint, but not
              // the words.
              const isLocked = i > 0;
              return (
                <div
                  key={i}
                  className={`rounded-xl border bg-card p-5 shadow-sm ${
                    isLocked ? "relative overflow-hidden" : ""
                  }`}
                >
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {v.angle}
                    {isLocked && <Lock className="ml-0.5 h-3 w-3" />}
                  </div>
                  <p
                    className={`text-sm leading-relaxed text-foreground ${
                      isLocked ? "select-none blur-sm" : ""
                    }`}
                    aria-hidden={isLocked}
                  >
                    &ldquo;{v.text}&rdquo;
                  </p>
                  {isLocked ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/95 via-background/60 to-transparent">
                      <Link
                        href="/signup?tool=testimonial-writer&unlock=variants"
                        onClick={() => track("writer_variant_unlock_clicked", { idx: i })}
                        className="flex items-center gap-2 rounded-full border border-primary/30 bg-background px-4 py-2 shadow-sm hover:border-primary/60"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold">Sign up to unlock this version</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant={copiedIdx === i ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => copyVariant(v.text, i)}
                      >
                        {copiedIdx === i ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => saveToWall(v.text)}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Save to my Wall of Love
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Nudge below the 3 variant cards */}
            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-sm text-foreground">
                <span className="font-semibold">You&apos;re seeing 1 of 3 versions.</span>{" "}
                <Link
                  href="/signup?tool=testimonial-writer"
                  onClick={() => track("writer_unlock_all_clicked")}
                  className="font-semibold text-primary hover:underline"
                >
                  Free signup unlocks all 3 + unlimited regenerations →
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Signup upsell */}
        <div className="mt-16 rounded-2xl border-2 border-primary/30 bg-primary/5 p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-bold">
                Collecting testimonials from customers?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Testimoni sends a form your customers can fill in 30 seconds —
                no login. Approve, and it&apos;s on your Wall of Love with one
                click. Free plan includes 10 testimonials.
              </p>
            </div>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to Testimoni
          </Link>
          <p>Free tool. No signup needed.</p>
        </div>
      </footer>
    </div>
  );
}
