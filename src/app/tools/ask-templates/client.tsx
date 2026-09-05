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
  MessageCircle,
  Mail,
  Send,
  Linkedin,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { ExitIntent } from "@/components/exit-intent";
import { ToolsHeader } from "@/components/tools-header";
import { ToolSignupUpsell } from "@/components/tool-signup-upsell";

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "email", label: "Email", icon: Mail },
  { id: "dm", label: "DM / Twitter", icon: Send },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "sms", label: "SMS", icon: Smartphone },
] as const;

const TONES = [
  { id: "casual", label: "Casual" },
  { id: "professional", label: "Professional" },
  { id: "warm", label: "Warm" },
] as const;

const ASKS = [
  { id: "text_only", label: "Just text" },
  { id: "text_and_rating", label: "Text + star rating" },
  { id: "video", label: "Video (30s)" },
] as const;

interface Variant {
  angle: string;
  body: string;
}

export function AskTemplatesClient() {
  const [customerName, setCustomerName] = useState("");
  const [yourName, setYourName] = useState("");
  const [business, setBusiness] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [channel, setChannel] = useState<typeof CHANNELS[number]["id"]>("whatsapp");
  const [tone, setTone] = useState<typeof TONES[number]["id"]>("casual");
  const [ask, setAsk] = useState<typeof ASKS[number]["id"]>("text_only");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!customerName.trim() || !business.trim()) return;
    setLoading(true);
    setError(null);
    track("ask_templates_generate_clicked", { channel, tone, ask });
    try {
      const res = await fetch("/api/tools/generate-ask-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          yourName,
          business,
          channel,
          tone,
          ask,
          formUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate. Try again.");
        return;
      }
      setVariants(data.variants);
      track("ask_templates_variants_shown", { count: data.variants?.length ?? 0 });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyVariant(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    track("ask_templates_variant_copied", { idx, channel });
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      <ToolsHeader backToTools />

      <main className="mx-auto max-w-3xl px-4 py-14">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Free · No signup
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            &ldquo;What do I even say?&rdquo;
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Copy-paste templates for asking customers to leave a testimonial —
            in the tone and channel they actually reply to.
          </p>
        </div>

        {/* Form */}
        <div className="mt-10 space-y-5 rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="customer" className="text-sm font-semibold">
                Customer&apos;s name *
              </Label>
              <Input
                id="customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Sarah"
                className="mt-1.5"
                maxLength={60}
              />
            </div>
            <div>
              <Label htmlFor="your" className="text-sm font-semibold">
                Your name
              </Label>
              <Input
                id="your"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="Alex"
                className="mt-1.5"
                maxLength={60}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="business" className="text-sm font-semibold">
              What are they leaving a testimonial about? *
            </Label>
            <Input
              id="business"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder="e.g. my design services / Acme Studio / the course"
              className="mt-1.5"
              maxLength={80}
            />
          </div>

          <div>
            <Label htmlFor="form" className="text-sm font-semibold">
              Your form URL <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="form"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="testimoni.io/f/your-form"
              className="mt-1.5"
              maxLength={200}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank if you don&apos;t have one yet — we&apos;ll use a placeholder.
            </p>
          </div>

          <div>
            <Label className="text-sm font-semibold">Channel</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-medium transition ${
                      channel === c.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-semibold">Tone</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`rounded-full border-2 px-2.5 py-1 text-xs font-medium ${
                      tone === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Ask type</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {ASKS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAsk(a.id)}
                    className={`rounded-full border-2 px-2.5 py-1 text-xs font-medium ${
                      ask === a.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={loading || !customerName.trim() || !business.trim()}
            size="lg"
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Writing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Give me 3 messages
              </>
            )}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Results */}
        {variants && (
          <div className="mt-10 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              3 versions — pick one, copy, send
            </p>
            {variants.map((v, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {v.angle}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {v.body}
                </p>
                <Button
                  variant={copiedIdx === i ? "default" : "outline"}
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => copyVariant(v.body, i)}
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
              </div>
            ))}
          </div>
        )}

        {/* Signup upsell */}
        <ToolSignupUpsell
          tool="ask-templates"
          headline="Sent the ask? Get a real form URL to include."
          description={
            <>
              Testimoni gives you a real form URL that customers can fill in
              30 seconds. Responses land in your inbox for one-click approval,
              then live on your Wall of Love.
            </>
          }
        />
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to Testimoni
          </Link>
          <p>Free tool. No signup needed.</p>
        </div>
      </footer>

      <ExitIntent surface="tools_ask_templates" />
    </div>
  );
}
