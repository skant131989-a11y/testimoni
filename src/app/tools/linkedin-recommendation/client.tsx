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
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { ExitIntent } from "@/components/exit-intent";
import { ToolsHeader } from "@/components/tools-header";
import { ToolSignupUpsell } from "@/components/tool-signup-upsell";

const RELATIONSHIPS = [
  { id: "worked_with", label: "Worked with them" },
  { id: "reported_to_me", label: "They reported to me" },
  { id: "reported_to_them", label: "I reported to them" },
  { id: "peer", label: "Peer" },
  { id: "client", label: "They were my client" },
  { id: "vendor", label: "I hired them as vendor" },
] as const;

const TONES = [
  { id: "professional", label: "Professional" },
  { id: "warm", label: "Warm" },
  { id: "punchy", label: "Punchy" },
] as const;

interface Variant {
  angle: string;
  text: string;
}

export function RecommendationClient() {
  const [personName, setPersonName] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [relationship, setRelationship] = useState<typeof RELATIONSHIPS[number]["id"]>("worked_with");
  const [tone, setTone] = useState<typeof TONES[number]["id"]>("professional");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!personName.trim() || !skills.trim()) return;
    setLoading(true);
    setError(null);
    track("linkedin_rec_generate_clicked", { relationship, tone });
    try {
      const res = await fetch("/api/tools/generate-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personName, role, skills, relationship, tone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate. Try again.");
        return;
      }
      setVariants(data.variants);
      track("linkedin_rec_variants_shown", { count: data.variants?.length ?? 0 });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyVariant(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    track("linkedin_rec_copied", { idx });
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      <ToolsHeader backToTools />

      <main className="mx-auto max-w-3xl px-4 py-14">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Linkedin className="h-3.5 w-3.5" /> Free · No signup
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            LinkedIn recommendation writer.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Someone asked you for a recommendation and you don&apos;t know where to
            start. Enter a name, their role, and what they&apos;re good at.
            You&apos;ll get 3 versions.
          </p>
        </div>

        {/* Form */}
        <div className="mt-10 space-y-5 rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="person" className="text-sm font-semibold">
                Their name *
              </Label>
              <Input
                id="person"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. Sarah Chen"
                className="mt-1.5"
                maxLength={80}
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-sm font-semibold">
                Role / title
              </Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Product designer at Acme"
                className="mt-1.5"
                maxLength={120}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="skills" className="text-sm font-semibold">
              What are they good at? *
            </Label>
            <Textarea
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. design systems, cross-team communication, turning fuzzy briefs into shipped features"
              rows={3}
              className="mt-1.5"
              maxLength={300}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {skills.length}/300 characters
            </p>
          </div>

          <div>
            <Label className="text-sm font-semibold">Relationship</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRelationship(r.id)}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-medium ${
                    relationship === r.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Tone</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-medium ${
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

          <Button
            onClick={generate}
            disabled={loading || !personName.trim() || !skills.trim()}
            size="lg"
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Writing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Give me 3 recommendations
              </>
            )}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Results */}
        {variants && (
          <div className="mt-10 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              3 versions
            </p>
            {variants.map((v, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {v.angle}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {v.text}
                </p>
                <Button
                  variant={copiedIdx === i ? "default" : "outline"}
                  size="sm"
                  className="mt-3 gap-1.5"
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
              </div>
            ))}
          </div>
        )}

        {/* Signup upsell */}
        <ToolSignupUpsell
          tool="linkedin-recommendation"
          headline="Collecting testimonials from your own network?"
          description={
            <>
              Testimoni gives you a form to send to past clients and
              colleagues. Every approved response lands on your Wall of Love
              — hosted URL + one-line embed for your site.
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

      <ExitIntent surface="tools_linkedin_recommendation" />
    </div>
  );
}
