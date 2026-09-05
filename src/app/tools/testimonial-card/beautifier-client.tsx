"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download, Copy, Star, Check, Sparkles, ArrowRight, Lock, ShieldAlert } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LetterAvatar } from "@/components/letter-avatar";
import { track } from "@/lib/analytics";
import { ExitIntent } from "@/components/exit-intent";
import { ToolsHeader } from "@/components/tools-header";

/**
 * Public, no-signup testimonial card generator.
 *
 * Free preview + PNG download. Signup gates:
 *   - Watermark removal (checkbox routes to /signup)
 *   - 2 premium themes visible but locked (click → /signup)
 */

const THEMES = [
  { id: "clean", label: "Clean", bg: "bg-white", text: "text-slate-900", muted: "text-slate-500", locked: false },
  { id: "dark", label: "Dark", bg: "bg-slate-900", text: "text-white", muted: "text-slate-400", locked: false },
  { id: "purple", label: "Purple", bg: "bg-gradient-to-br from-purple-600 to-indigo-700", text: "text-white", muted: "text-purple-100", locked: false },
  { id: "warm", label: "Warm", bg: "bg-gradient-to-br from-orange-100 to-rose-100", text: "text-slate-900", muted: "text-slate-600", locked: false },
  { id: "gradient", label: "Gradient (Pro)", bg: "bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700", text: "text-white", muted: "text-cyan-100", locked: true },
  { id: "editorial", label: "Editorial (Pro)", bg: "bg-stone-950", text: "text-amber-50", muted: "text-amber-200/60", locked: true },
] as const;

const FORMATS = [
  { id: "twitter", label: "Twitter / X (1200×675)", width: 1200, height: 675 },
  { id: "square", label: "Instagram / LinkedIn square (1080×1080)", width: 1080, height: 1080 },
  { id: "linkedin", label: "LinkedIn post (1200×627)", width: 1200, height: 627 },
] as const;

export function BeautifierClient() {
  const [quote, setQuote] = useState(
    "Paste a tweet, and 30 seconds later I had a live testimonial on my landing page. Cannot believe I was screenshotting before."
  );
  const [name, setName] = useState("Sarah Chen");
  const [title, setTitle] = useState("SaaS founder");
  const [rating, setRating] = useState(5);
  const [themeId, setThemeId] = useState<typeof THEMES[number]["id"]>("clean");
  const [formatId, setFormatId] = useState<typeof FORMATS[number]["id"]>("twitter");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  // Tamper alert — set when the watermark integrity check fails.
  // Clears when the user changes any input (they've likely refreshed
  // the card by editing text/theme/etc).
  const [tamperError, setTamperError] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const theme = THEMES.find((t) => t.id === themeId)!;
  const format = FORMATS.find((f) => f.id === formatId)!;

  function handleThemeClick(id: typeof THEMES[number]["id"], locked: boolean) {
    if (locked) {
      track("beautifier_locked_theme_clicked", { theme: id });
      window.location.assign(`/signup?tool=testimonial-card&unlock=theme`);
      return;
    }
    setThemeId(id);
  }

  function handleWatermarkUnlock() {
    track("beautifier_watermark_unlock_clicked");
    window.location.assign(`/signup?tool=testimonial-card&unlock=watermark`);
  }

  async function handleDownload() {
    if (!cardRef.current) return;

    // Watermark integrity check — signup unlocks the toggle, so anyone
    // downloading without signup MUST ship the watermark. Blocks casual
    // devtool poking (delete node, change text). Not a real security
    // measure — a determined user can override this in the debugger —
    // but stops the 90%.
    const wm = cardRef.current.querySelector('[data-fw-watermark="testimoni"]');
    const wmText = wm?.textContent?.toLowerCase() ?? "";
    if (!wm || !wmText.includes("testimoni.io")) {
      track("beautifier_watermark_tampered");
      setTamperError(true);
      return;
    }
    setTamperError(false);

    setDownloading(true);
    track("beautifier_download_clicked", { theme: themeId, format: formatId, rating });
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `testimonial-${formatId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("card export failed", err);
    } finally {
      setDownloading(false);
    }
  }

  async function copyQuote() {
    await navigator.clipboard.writeText(`"${quote}" — ${name}${title ? `, ${title}` : ""}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /**
   * Bridge to the product — stash the current card's quote + author
   * so the signup welcome page auto-adds it to their fresh Wall of
   * Love. Downloading the image is fine anonymously; saving it as
   * a persistent testimonial requires the signup.
   */
  function saveToWall() {
    try {
      sessionStorage.setItem(
        "pending_tool_testimonial",
        JSON.stringify({
          content: quote,
          customerName: name,
          customerTitle: title || null,
          rating,
          tool: "card",
        })
      );
    } catch {}
    track("beautifier_save_to_wall_clicked", { theme: themeId, rating });
    window.location.assign("/signup?tool=testimonial-card&intent=save");
  }

  return (
    <div className="min-h-screen bg-background">
      <ToolsHeader backToTools />

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Free · No signup
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Testimonial card generator
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Turn any customer quote into a shareable image for Twitter, LinkedIn, or Instagram. Type. Pick a theme. Download.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Editor panel */}
          <div className="space-y-5">
            <div>
              <Label htmlFor="quote" className="text-sm font-semibold">Their words</Label>
              <Textarea id="quote" value={quote} onChange={(e) => setQuote(e.target.value)} rows={5} className="mt-1.5" placeholder="What did they say?" maxLength={280} />
              <p className="mt-1 text-xs text-muted-foreground">{quote.length}/280 characters</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-sm font-semibold">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="Jane Smith" />
              </div>
              <div>
                <Label htmlFor="title" className="text-sm font-semibold">Title / role</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" placeholder="CEO at Acme" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Star rating</Label>
              <div className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} className="p-1" aria-label={`${n} star${n === 1 ? "" : "s"}`}>
                    <Star className={n <= rating ? "h-6 w-6 fill-yellow-400 text-yellow-400" : "h-6 w-6 text-muted-foreground/30"} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Theme</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeClick(t.id, t.locked)}
                    className={`relative rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                      themeId === t.id
                        ? "border-primary bg-primary/5"
                        : t.locked
                        ? "border-dashed border-border/70 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {t.locked && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </span>
                    )}
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                2 Pro themes locked —{" "}
                <button type="button" onClick={handleWatermarkUnlock} className="font-semibold text-primary hover:underline">
                  free signup unlocks all →
                </button>
              </p>
            </div>

            <div>
              <Label htmlFor="format" className="text-sm font-semibold">Format</Label>
              <select id="format" value={formatId} onChange={(e) => setFormatId(e.target.value as typeof FORMATS[number]["id"])} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Watermark toggle — click routes to signup */}
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5" checked={false} onChange={handleWatermarkUnlock} />
                <span>
                  <span className="font-semibold">Remove &ldquo;Made with Testimoni&rdquo; watermark</span>
                  <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Signup
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Free forever — takes 15 seconds.
                  </span>
                </span>
              </label>
            </div>

            {/* Watermark integrity error — appears if the user edits
                or removes the "Made with testimoni.io" node via DevTools
                and then tries to download. Doubles as a signup CTA. */}
            {tamperError && (
              <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-destructive">
                      Watermark modified — download blocked
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      The &ldquo;Made with testimoni.io&rdquo; line looks tampered.
                      Refresh the page to reset it, or sign up (free, 30 seconds) to
                      remove the watermark properly.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link href="/signup?tool=testimonial-card&unlock=watermark">
                        <Button size="sm" className="h-7 gap-1 text-xs">
                          Sign up to remove <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setTamperError(false);
                          if (typeof window !== "undefined") window.location.reload();
                        }}
                        className="h-7 text-xs"
                      >
                        Refresh page
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleDownload} disabled={downloading || !quote.trim() || !name.trim()} size="lg" className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                {downloading ? "Rendering…" : "Download PNG"}
              </Button>
              <Button onClick={copyQuote} variant="outline" size="lg" title="Copy quote text">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Save-to-product bridge — stashes the current quote and
                routes to signup. Welcome page auto-persists it as a
                Manual testimonial in the new user's workspace. */}
            <Button
              onClick={saveToWall}
              variant="secondary"
              size="lg"
              className="w-full gap-2 border-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
              disabled={!quote.trim() || !name.trim()}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Save this quote to my Wall of Love
            </Button>
          </div>

          {/* Preview panel */}
          <div className="min-w-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
            <div className="overflow-auto rounded-xl border bg-muted/30 p-4">
              <div className="mx-auto" style={{ maxWidth: "100%", overflow: "hidden" }}>
                <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: `${format.width * 0.5}px`, height: `${format.height * 0.5}px` }}>
                  <div
                    ref={cardRef}
                    className={`flex flex-col justify-center ${theme.bg} ${theme.text}`}
                    style={{ width: `${format.width}px`, height: `${format.height}px`, padding: "80px", boxSizing: "border-box" }}
                  >
                    <div style={{ display: "flex", gap: "6px" }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} style={{ width: "36px", height: "36px" }} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
                      ))}
                    </div>
                    <p style={{ fontSize: format.height >= 900 ? "44px" : "40px", lineHeight: 1.35, fontWeight: 600, marginTop: "32px" }}>
                      &ldquo;{quote}&rdquo;
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "48px" }}>
                      <LetterAvatar name={name} size={72} />
                      <div>
                        <p style={{ fontSize: "26px", fontWeight: 700, margin: 0 }}>{name}</p>
                        {title && (
                          <p className={theme.muted} style={{ fontSize: "20px", marginTop: "4px", margin: 0 }}>
                            {title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      data-fw-watermark="testimoni"
                      className={theme.muted}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginTop: "auto",
                        paddingTop: "32px",
                        opacity: 0.85,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "#7c3aed",
                          color: "white",
                          fontSize: "18px",
                          fontWeight: 900,
                          lineHeight: 1,
                        }}
                      >
                        &ldquo;
                      </div>
                      <span style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-0.01em" }}>
                        testimoni.io
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Actual size: {format.width} × {format.height}px · Downloaded at 2× for retina
            </p>
          </div>
        </div>

        {/* Signup upsell */}
        <div className="mx-auto mt-16 max-w-3xl rounded-2xl border-2 border-primary/30 bg-primary/5 p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Free signup unlocks
              </div>
              <h2 className="text-2xl font-bold">Want a whole Wall of Love, not just one card?</h2>
              <p className="mt-2 text-muted-foreground">
                Signup unlocks: <span className="font-semibold text-foreground">no watermark</span>, <span className="font-semibold text-foreground">2 Pro themes</span>, and the full Testimoni product — collect, host, and embed testimonials on your site. Free plan includes 10 testimonials.
              </p>
            </div>
            <Link href="/signup?tool=testimonial-card">
              <Button size="lg" className="gap-2">
                Unlock free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">← Back to Testimoni</Link>
          <p>Free tool. No signup needed.</p>
        </div>
      </footer>

      <ExitIntent surface="tools_testimonial_card" />
    </div>
  );
}
