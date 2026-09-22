"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";

const STAGES = [
  "Reading your website…",
  "Searching X, Reddit, and LinkedIn…",
  "Sorting praise from complaints…",
  "Spotting feature requests…",
  "Checking for competitor mentions…",
  "Writing the summary…",
  "Almost done…",
];

export function CustomerVoiceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(() => searchParams?.get("url") ?? "");
  const [status, setStatus] = useState<"idle" | "searching" | "error">("idle");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [signupUrl, setSignupUrl] = useState<string | null>(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (status !== "searching") return;
    const t = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 2200);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    const preUrl = searchParams?.get("url")?.trim();
    if (!preUrl) return;
    // The ref check/set happens inside the timeout callback, not at
    // effect-setup time — React Strict Mode's dev-only mount → cleanup
    // → mount cycle would otherwise set the ref true on the first
    // (discarded) pass, then bail out of the second (real) pass before
    // ever scheduling a timer, so the auto-submit silently never fires.
    const t = setTimeout(() => {
      if (autoSubmittedRef.current) return;
      autoSubmittedRef.current = true;
      document
        .getElementById("customer-voice-form")
        ?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setStatus("searching");
    setStage(0);
    setError(null);
    setSignupUrl(null);
    track("scan_started", { url: trimmed });
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setSignupUrl(data.signupUrl ?? null);
        setStatus("error");
        track("scan_failed", { url: trimmed, reason: data.error });
        return;
      }
      track("scan_completed", {
        url: trimmed,
        total: data.totalMentions,
        cached: data.cached,
      });
      router.push(`/tools/customer-voice/${data.id}`);
    } catch {
      setError("Network hiccup. Try again in a moment.");
      setStatus("error");
    }
  }

  if (status === "searching") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <h2 className="mt-6 text-3xl font-bold">Scanning the web for {url}</h2>
        <div className="mx-auto mt-8 max-w-md space-y-3">
          {STAGES.slice(0, stage + 1).map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 text-left text-sm"
              style={{ opacity: i === stage ? 1 : 0.5 }}
            >
              {i === stage ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <div className="h-4 w-4 shrink-0 rounded-full bg-emerald-500" />
              )}
              <span className={i === stage ? "font-medium" : ""}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="h-3 w-3" /> New
      </div>
      <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
        Find what customers{" "}
        <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
          really say
        </span>{" "}
        about your product.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
        Paste your website. We find the praise, the complaints, the feature requests, and the
        competitor mentions — all in one report. No signup to see what we find.
      </p>

      <form id="customer-voice-form" onSubmit={handleSubmit} className="mx-auto mt-10 max-w-xl">
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-primary/30 bg-card p-3 shadow-lg md:flex-row">
          <div className="flex flex-1 items-center gap-2 px-3">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              type="text"
              placeholder="acme.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border-0 bg-transparent text-lg shadow-none focus-visible:ring-0"
              autoFocus
              required
            />
          </div>
          <Button type="submit" size="lg" className="gap-2 shrink-0" disabled={!url.trim()}>
            Find out <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Free to scan · No signup · Full report unlocks for a one-time $9
        </p>
      </form>

      {error && (
        <div className="mx-auto mt-6 max-w-xl rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <p>{error}</p>
          {signupUrl && (
            <Link href={signupUrl} className="mt-2 inline-flex items-center gap-1 font-semibold underline underline-offset-4">
              Sign up free for more scans <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
