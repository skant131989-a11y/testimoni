"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  Twitter,
  Linkedin,
  MessageCircle,
  Star,
  Trophy,
  ExternalLink,
  Link2,
  Image as ImageIcon,
  Type,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import {
  addPendingTestimonial,
  addPendingTestimonials,
} from "@/lib/pending-testimonials";

interface Platform {
  name: string;
  count: number;
}

interface Quote {
  content: string;
  author: string;
  role?: string;
  source: string;
  sourceUrl?: string;
  score: number;
}

interface Result {
  brand: string;
  totalMentions: number;
  platforms: Platform[];
  topQuotes: Quote[];
  cached?: boolean;
  provider?: "tavily" | "groq" | "claude";
}

// Stage messages shown during the API call. Each one dwells long
// enough to feel real without dragging the wait past 30s. The
// backend call is a single Claude request; these stages are pure
// UI theater to make the wait feel discoverable.
const STAGES = [
  "Reading your website…",
  "Searching X for mentions…",
  "Scanning Reddit threads…",
  "Checking LinkedIn posts…",
  "Reading Product Hunt comments…",
  "Filtering out complaints and questions…",
  "Ranking the strongest quotes…",
  "Almost done — one final pass…",
];

function PlatformIcon({ name }: { name: string }) {
  const key = name.toLowerCase();
  if (key.includes("x") || key.includes("twitter"))
    return <Twitter className="h-4 w-4 text-sky-500" />;
  if (key.includes("linked"))
    return <Linkedin className="h-4 w-4 text-blue-600" />;
  if (key.includes("reddit"))
    return <MessageCircle className="h-4 w-4 text-orange-500" />;
  if (key.includes("product hunt"))
    return <Trophy className="h-4 w-4 text-orange-600" />;
  if (key.includes("app store") || key.includes("play"))
    return <Star className="h-4 w-4 text-yellow-500" />;
  return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
}

export function FindMyProofClient() {
  const searchParams = useSearchParams();
  // ?mode=import lands the user in a "add praise you already have"
  // mode: search input hidden, ImportPanel promoted to the top.
  // We strip the query param from the URL after mount so refresh /
  // deep-link feels clean.
  const isImportMode = searchParams?.get("mode") === "import";
  useEffect(() => {
    if (!isImportMode) return;
    // Delay slightly so React finishes the mount; if the browser
    // still shows the raw ?mode=import for a beat, users don't
    // read query strings anyway.
    const t = setTimeout(() => {
      try {
        window.history.replaceState(null, "", "/tools/find-my-proof");
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [isImportMode]);

  const [url, setUrl] = useState(() => searchParams?.get("url") ?? "");
  const [status, setStatus] = useState<"idle" | "searching" | "done" | "error">(
    "idle",
  );
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [twitterHandles, setTwitterHandles] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [extra, setExtra] = useState("");
  // Auto-submit if the caller pre-filled a URL via ?url=... on the
  // query string (used by the home hero form). Short delay so the
  // user sees the input pop in before the loading UI takes over —
  // reads as "your click worked" instead of "did anything happen?".
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (status !== "searching") return;
    const t = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 2200);    return () => clearInterval(t);
  }, [status]);

  // Auto-submit if the URL came in on the query string (from the
  // home hero form). Fires exactly once per mount.
  useEffect(() => {
    if (autoSubmittedRef.current) return;
    const preUrl = searchParams?.get("url")?.trim();
    if (!preUrl) return;
    autoSubmittedRef.current = true;
    const t = setTimeout(() => {
      // Fake a form submit so all the existing handleSubmit logic
      // runs (analytics, error handling, cache lookup).
      document
        .getElementById("find-my-proof-form")
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
    setResult(null);
    // Split comma-separated handles and strip whitespace + leading @.
    const handleList = twitterHandles
      .split(",")
      .map((h) => h.trim().replace(/^@/, ""))
      .filter(Boolean);
    track("find_proof_search", {
      url: trimmed,
      advancedUsed: showAdvanced && (handleList.length > 0 || !!linkedinUrl || !!extra),
    });
    try {
      const res = await fetch("/api/tools/find-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          twitterHandles: handleList.length > 0 ? handleList : undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          extra: extra.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setStatus("error");
        track("find_proof_failed", { url: trimmed, reason: data.error });
        return;
      }
      setResult(data);
      setStatus("done");
      // Drop everything we found into the anonymous tray so it
      // survives to signup. onAdd (in ResultView) adds imported
      // quotes on top of these.
      if (Array.isArray(data.topQuotes) && data.topQuotes.length > 0) {
        addPendingTestimonials(
          data.topQuotes.map((q: Quote) => ({
            content: q.content,
            author: q.author,
            role: q.role,
            source: q.source,
            sourceUrl: q.sourceUrl,
            origin: "find_my_proof_search",
          })),
        );
      }
      track("find_proof_success", {
        url: trimmed,
        total: data.totalMentions,
        quotes: data.topQuotes?.length ?? 0,
      });
    } catch {
      setError("Network hiccup. Try again in a moment.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setUrl("");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
      {(status === "idle" || status === "error") && isImportMode ? (
        <ImportModeIdle
          onSearchInstead={() => {
            // Clear import-mode flag and reveal the search hero.
            try {
              window.history.replaceState(null, "", "/tools/find-my-proof");
            } catch {}
            window.location.reload();
          }}
        />
      ) : status === "idle" || status === "error" ? (
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> New experiment
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Your best testimonials are{" "}
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
              already out there.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Paste your website URL. We scan X, LinkedIn, Reddit, Product Hunt,
            App Store, and more for real customer love — no account needed to
            see what we find.
          </p>

          <form
            id="find-my-proof-form"
            onSubmit={handleSubmit}
            className="mx-auto mt-10 max-w-xl"
          >
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
              <Button
                type="submit"
                size="lg"
                className="gap-2 shrink-0"
                disabled={!url.trim()}
              >
                Find my proof
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Free while we experiment · No signup · Takes about 20 seconds
            </p>

            {/* Advanced references — hidden by default. If the user
                doesn't open it, the server auto-scrapes handles from
                the homepage. Opening it lets the user override. */}
            <div className="mt-4 text-center">
              {!showAdvanced ? (
                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                >
                  Want to add more references — Twitter handles, LinkedIn, product hashtags?
                </button>
              ) : (
                <div className="mx-auto mt-2 max-w-xl space-y-3 rounded-xl border bg-muted/30 p-4 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Extra references (optional)
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Hide
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      X / Twitter handles
                      <span className="text-muted-foreground">
                        {" "}
                        — comma-separated
                      </span>
                    </label>
                    <Input
                      type="text"
                      value={twitterHandles}
                      onChange={(e) => setTwitterHandles(e.target.value)}
                      placeholder="@usetestimoni, @neha"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      LinkedIn URL{" "}
                      <span className="text-muted-foreground">
                        — company or founder
                      </span>
                    </label>
                    <Input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="linkedin.com/company/testimoni"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      Anything else{" "}
                      <span className="text-muted-foreground">
                        — hashtags, alt names, taglines
                      </span>
                    </label>
                    <Input
                      type="text"
                      value={extra}
                      onChange={(e) => setExtra(e.target.value)}
                      placeholder="#testimoniio, wall of love, testimoni.app"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    We&apos;ll search these alongside your URL so we don&apos;t
                    miss praise that only mentions your handle.
                  </p>
                </div>
              )}
            </div>
          </form>

          {error && (
            <div className="mx-auto mt-6 max-w-xl rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Examples */}
          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Try one of these
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
              {["notion.so", "linear.app", "vercel.com", "supabase.com"].map(
                (example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setUrl(example)}
                    className="rounded-full border bg-card px-3 py-1.5 font-medium hover:border-primary hover:text-primary"
                  >
                    {example}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      ) : status === "searching" ? (
        <SearchingState stageIdx={stage} url={url} />
      ) : (
        <ResultView result={result!} onReset={reset} />
      )}
    </div>
  );
}

function SearchingState({ stageIdx, url }: { stageIdx: number; url: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <h2 className="mt-6 text-3xl font-bold">
        Scanning the web for {url}
      </h2>
      <div className="mx-auto mt-8 max-w-md space-y-3">
        {STAGES.slice(0, stageIdx + 1).map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border bg-card p-3 text-left text-sm"
            style={{
              opacity: i === stageIdx ? 1 : 0.5,
            }}
          >
            {i === stageIdx ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <div className="h-4 w-4 shrink-0 rounded-full bg-emerald-500" />
            )}
            <span className={i === stageIdx ? "font-medium" : ""}>{s}</span>
          </div>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Powered by Claude · Real-time web search
      </p>
    </div>
  );
}

function ResultView({ result, onReset }: { result: Result; onReset: () => void }) {
  // Local mutable state — user-added quotes from the import panel
  // get appended here so the results list grows in real time.
  const [added, setAdded] = useState<Quote[]>([]);
  const allQuotes = [...result.topQuotes, ...added];
  const hasQuotes = allQuotes.length > 0;

  function addQuote(q: Quote) {
    setAdded((prev) => [...prev, q]);
    // Persist to the anonymous tray so it survives signup.
    addPendingTestimonial({
      content: q.content,
      author: q.author,
      role: q.role,
      source: q.source,
      sourceUrl: q.sourceUrl,
      origin: "find_my_proof_import",
    });
  }
  return (
    <div>
      {/* Result header */}
      <div className="text-center">
        {hasQuotes ? (
          <>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              🎉 Found it
            </div>
            <h2 className="text-4xl font-bold md:text-5xl">
              We found{" "}
              <span className="text-primary">{result.totalMentions}</span>{" "}
              mentions of{" "}
              <span className="text-primary">{result.brand}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Here are the {result.topQuotes.length} strongest —
              already ranked, already sourced.
            </p>
          </>
        ) : (
          <>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              Almost empty
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">
              We couldn&rsquo;t find public praise for {result.brand} yet.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Two things can make this better:
            </p>
            <ul className="mx-auto mt-3 max-w-md space-y-2 text-left text-sm text-muted-foreground">
              <li>
                • <strong className="text-foreground">Try again with your X handle</strong> — most
                praise about small brands lives in @-mentions and founder-timeline
                replies that don&rsquo;t get indexed by domain search.
              </li>
              <li>
                • <strong className="text-foreground">Sign up and send a form</strong> to your
                existing customers — most walls start empty and grow from there.
              </li>
            </ul>
          </>
        )}
      </div>

      {/* Platform breakdown — only shown when we have actual quotes
          to back the counts. Showing "2 Blog" with no quotes gives
          the user nothing to click on and looks broken. */}
      {result.platforms.length > 0 && result.topQuotes.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {result.platforms.map((p) => (
            <div
              key={p.name}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm"
            >
              <PlatformIcon name={p.name} />
              <span className="font-semibold">{p.count}</span>
              <span className="text-muted-foreground">{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quotes */}
      {hasQuotes && (
        <div className="mt-10 space-y-4">
          {allQuotes.map((q, i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-primary/15 bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-bold uppercase tracking-wider text-primary">
                    #{i + 1} · {q.score}/100
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <PlatformIcon name={q.source} />
                    <span>{q.source}</span>
                  </div>
                </div>
                {q.sourceUrl && (
                  <a
                    href={q.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Source <ExternalLink className="ml-1 inline-block h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="mt-4 text-lg italic leading-relaxed">
                &ldquo;{q.content}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3 border-t pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {q.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{q.author}</p>
                  {q.role && (
                    <p className="text-xs text-muted-foreground">{q.role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import panel — always shown, but framed differently based
          on whether we found quotes. When empty, it's the primary
          action. When we found some, it's a "know something we don't?"
          nudge. */}
      <ImportPanel hasQuotes={hasQuotes} onAdd={addQuote} />

      {/* CTA */}
      <div className="mt-12 rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-fuchsia-50 p-8 text-center">
        <h3 className="text-2xl font-bold md:text-3xl">
          {hasQuotes
            ? `Save ${allQuotes.length === 1 ? "this" : `these ${allQuotes.length}`} to your Wall of Love`
            : "Start your Wall of Love"}
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {hasQuotes
            ? "Sign up free — we'll turn these into an embeddable widget you can drop on your site with one line of code."
            : "Sign up free — 10 testimonials, 1 wall, one line of embed. No credit card."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup?src=find_my_proof&import=pending">
            <Button size="lg" className="gap-2">
              {allQuotes.length > 0
                ? `Sign up & save ${allQuotes.length} to my wall`
                : "Sign up free"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Try another URL
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        This is an experiment. Miss a quote you know is out there?{" "}
        <a href="/contact" className="underline">
          Tell us
        </a>{" "}
        — we&rsquo;ll tune the search.
        {result.provider && (
          <span className="ml-2 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider">
            via{" "}
            {result.provider === "tavily"
              ? "Tavily+Groq (free)"
              : result.provider === "groq"
                ? "Groq (free)"
                : "Claude"}
          </span>
        )}
        {result.cached && (
          <span className="ml-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider">
            cached
          </span>
        )}
      </div>
    </div>
  );
}

// ── Import panel ────────────────────────────────────────────────
// Three tabs: paste a link, upload a screenshot, or type it in.
// Each tab has its own tiny form; on success we call onAdd(quote)
// which appends to the results list above.

type Tab = "link" | "image" | "text";

function ImportPanel({
  hasQuotes,
  onAdd,
}: {
  hasQuotes: boolean;
  onAdd: (q: Quote) => void;
}) {
  const [tab, setTab] = useState<Tab>("link");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Per-tab local state.
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");

  async function submitLink() {
    if (!url.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tools/find-proof/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "url", url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't import that link.");
      onAdd(data.quote);
      setUrl("");
      track("find_proof_import", { kind: "url", ok: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      track("find_proof_import", { kind: "url", ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function submitText() {
    if (!text.trim() || !author.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tools/find-proof/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "text",
          author: author.trim(),
          content: text.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't add that.");
      onAdd(data.quote);
      setText("");
      setAuthor("");
      track("find_proof_import", { kind: "text", ok: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      track("find_proof_import", { kind: "text", ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function submitImage(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      setErr("That image is over 8 MB — please try a smaller one.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/tools/find-proof/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "image", image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read that image.");
      onAdd(data.quote);
      track("find_proof_import", { kind: "image", ok: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      track("find_proof_import", { kind: "image", ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 rounded-2xl border-2 border-dashed border-primary/25 bg-muted/30 p-6">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold">
          {hasQuotes
            ? "Know praise we missed? Add it here."
            : "Add praise you already have."}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Most love about small brands lives in DMs, replies, and screenshots —
          drop it in and we&rsquo;ll show it on your wall.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="mx-auto flex max-w-md justify-center gap-2 rounded-full border bg-background p-1">
        <TabButton active={tab === "link"} onClick={() => setTab("link")}>
          <Link2 className="h-4 w-4" /> Paste a link
        </TabButton>
        <TabButton active={tab === "image"} onClick={() => setTab("image")}>
          <ImageIcon className="h-4 w-4" /> Upload screenshot
        </TabButton>
        <TabButton active={tab === "text"} onClick={() => setTab("text")}>
          <Type className="h-4 w-4" /> Type it in
        </TabButton>
      </div>

      <div className="mx-auto mt-5 max-w-md">
        {tab === "link" && (
          <div className="space-y-2">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Tweet URL, LinkedIn post, blog review, etc."
              disabled={busy}
            />
            <Button
              type="button"
              className="w-full gap-2"
              onClick={submitLink}
              disabled={busy || !url.trim()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add this link
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Works with public pages. Some login-gated posts (X, LinkedIn) may
              be blocked — use the screenshot tab instead.
            </p>
          </div>
        )}

        {tab === "image" && (
          <div className="space-y-2">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-background p-6 hover:bg-primary/5">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                {busy ? "Reading your screenshot…" : "Click or drop an image"}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                DM screenshots, Slack praise, email replies · PNG/JPG · ≤8 MB
              </p>
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) submitImage(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        )}

        {tab === "text" && (
          <div className="space-y-2">
            <Input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Who said it? — name or @handle"
              disabled={busy}
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste what they said, word for word."
              disabled={busy}
              rows={4}
              className="w-full rounded-md border bg-background p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              type="button"
              className="w-full gap-2"
              onClick={submitText}
              disabled={busy || !text.trim() || !author.trim()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add this quote
            </Button>
          </div>
        )}

        {err && (
          <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center text-xs text-destructive">
            {err}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ── Import-mode idle screen ─────────────────────────────────────
// Rendered when the user lands via /tools/find-my-proof?mode=import
// (from the home page "Paste a link" CTA). Skips the domain-search
// intro entirely and puts the ImportPanel front and center.

function ImportModeIdle({ onSearchInstead }: { onSearchInstead: () => void }) {
  const [added, setAdded] = useState<Quote[]>([]);
  function addQuote(q: Quote) {
    setAdded((prev) => [...prev, q]);
    addPendingTestimonial({
      content: q.content,
      author: q.author,
      role: q.role,
      source: q.source,
      sourceUrl: q.sourceUrl,
      origin: "find_my_proof_import_mode",
    });
  }

  return (
    <div>
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <Sparkles className="h-3 w-3" /> Link it · 3 seconds
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Drop the{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            praise
          </span>{" "}
          you already have.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Paste a tweet, LinkedIn post, Reddit comment, or blog URL. We pull
          the quote, author, and source — you keep the original link. Add
          as many as you want.
        </p>
      </div>

      {/* Promoted import panel — reuse the same component the results
          view uses, so the "add" flow is identical. */}
      <ImportPanel hasQuotes={added.length > 0} onAdd={addQuote} />

      {/* Show the running list of added quotes above the CTA. */}
      {added.length > 0 && (
        <div className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">
            {added.length} added — ready to save
          </h2>
          {added.map((q, i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-primary/15 bg-card p-6 shadow-sm"
            >
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                #{i + 1} · via {q.source}
              </div>
              <p className="mt-2 text-lg italic leading-relaxed">
                &ldquo;{q.content}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3 border-t pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {q.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{q.author}</p>
                  {q.role && (
                    <p className="text-xs text-muted-foreground">{q.role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA + escape hatch */}
      <div className="mt-10 rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-fuchsia-50 p-8 text-center">
        <h3 className="text-2xl font-bold md:text-3xl">
          {added.length > 0
            ? `Save ${added.length} to your Wall of Love`
            : "Save what you paste to your wall"}
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Sign up free — we&rsquo;ll add each testimonial to your embeddable
          Wall of Love. No credit card, no gimmicks.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup?src=find_my_proof_import&import=pending">
            <Button size="lg" className="gap-2">
              {added.length > 0
                ? `Sign up & save ${added.length}`
                : "Sign up free"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <button
            type="button"
            onClick={onSearchInstead}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Or search a whole website →
          </button>
        </div>
      </div>
    </div>
  );
}
