"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";

interface FormConfig {
  id: string;
  headline: string;
  description: string | null;
  allowRating: boolean;
  allowVideo: boolean;
  thankYouMessage: string;
  workspace: { name: string; logoUrl: string | null };
}

export default function PublicCollectionForm({
  formConfig,
  contentLabel = "Your testimonial",
  contentPlaceholder = "Tell us about your experience...",
}: {
  formConfig: FormConfig;
  /** Label above the message textarea. Defaults to "Your testimonial"
   *  which fits the customer-collection use case; the founder /contact
   *  page overrides to "Your message" since those submissions aren't
   *  customer praise. */
  contentLabel?: string;
  contentPlaceholder?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  // Honeypot — real users never see or fill this. Bots that auto-
  // populate every input trip it and we drop the submission silently
  // via server-side rejection (schema.honeypot must be empty).
  const [honeypot, setHoneypot] = useState("");

  // Fire once per page mount — anonymous funnel start.
  // Uses anonymous: true so PostHog does NOT attach the current
  // logged-in user's identity even if the workspace owner is
  // testing their own form in the same browser session. The event
  // properties never include customer name/email/testimonial text.
  useEffect(() => {
    track(
      "form_viewed",
      {
        form_id: formConfig.id,
        workspace_name: formConfig.workspace.name,
        allow_rating: formConfig.allowRating,
        allow_video: formConfig.allowVideo,
      },
      { anonymous: true },
    );
  }, [formConfig.id, formConfig.workspace.name, formConfig.allowRating, formConfig.allowVideo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!content.trim() && !rating) {
      setError(`Please provide a ${contentLabel.toLowerCase()} or rating`);
      return;
    }
    // Client-side min-length — matches the server schema (20 chars).
    // Also fires when the field was optional but they still typed a
    // one-liner. Fail fast so the user gets a friendly hint, not a
    // generic "Validation failed" from the API.
    if (content.trim() && content.trim().length < 20) {
      setError("Please write at least 20 characters.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: formConfig.id,
          customerName: name,
          // Send undefined (via omit) for blank optional fields — Zod
          // treats "" as an invalid email on the server otherwise.
          customerEmail: email.trim() || undefined,
          content: content.trim() || undefined,
          // Rating is `.optional()` in the Zod schema — that accepts
          // undefined but NOT null. Sending null (when the user didn't
          // pick stars) caused a "Validation failed" error on every
          // submission that omitted a rating. Send undefined instead
          // so the field is truly absent from the payload.
          rating: rating || undefined,
          answers: jobTitle.trim() ? { jobTitle: jobTitle.trim() } : {},
          // Honeypot value — real users send "" (rejected as spam
          // only when a bot filled the hidden field with something).
          honeypot,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        track(
          "form_submit_failed",
          {
            form_id: formConfig.id,
            workspace_name: formConfig.workspace.name,
            error: data.error || "unknown",
          },
          { anonymous: true },
        );
        setError(data.error || "Something went wrong");
        return;
      }

      // Successful submission — anonymous funnel completion. Flags
      // let us compute what got filled without shipping PII: only
      // booleans for text/rating/email/title presence, plus the
      // content length bucket (not the content itself).
      track(
        "form_submitted",
        {
          form_id: formConfig.id,
          workspace_name: formConfig.workspace.name,
          has_text: !!content.trim(),
          has_rating: !!rating,
          has_email: !!email.trim(),
          has_title: !!jobTitle.trim(),
          rating: rating || undefined,
          text_length_bucket: bucketTextLength(content.trim().length),
        },
        { anonymous: true },
      );
      setSubmitted(true);
    } catch {
      track(
        "form_submit_failed",
        {
          form_id: formConfig.id,
          workspace_name: formConfig.workspace.name,
          error: "network",
        },
        { anonymous: true },
      );
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    // Only on real testimonial forms; the founder's contact form reuses this
    // component for plain messages, which are not something to share.
    const isTestimonialForm = contentLabel === "Your testimonial";
    const words = content.trim();
    const pageUrl = typeof window !== "undefined" ? window.location.href.split("#")[0] : "";
    const shareText = words
      ? `“${words.length > 220 ? words.slice(0, 217) + "…" : words}” (my review of ${formConfig.workspace.name})`
      : `I just left a ${rating}★ review for ${formConfig.workspace.name}`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
    const shared = (channel: string) =>
      track("thank_you_share_clicked", { channel, workspace_name: formConfig.workspace.name }, { anonymous: true });

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-10">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold">Thank you!</h2>
            <p className="mt-2 text-muted-foreground">
              {formConfig.thankYouMessage}
            </p>

            {isTestimonialForm && (words || rating > 0) && (
              <div className="mt-6 text-left">
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your words
                </p>
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
                  {rating > 0 && (
                    <div className="flex gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= rating ? "fill-current" : "text-gray-200"}`} />
                      ))}
                    </div>
                  )}
                  {words && <p className="mt-2 text-sm italic leading-relaxed">&ldquo;{words}&rdquo;</p>}
                  <p className="mt-3 text-xs font-semibold">
                    {name.trim()}
                    <span className="font-normal text-muted-foreground"> on {formConfig.workspace.name}</span>
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => shared("x")}
                    className="rounded-full border px-3.5 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    Share on X
                  </a>
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => shared("linkedin")}
                    className="rounded-full border px-3.5 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    Share on LinkedIn
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      shared("copy");
                      void navigator.clipboard?.writeText(`${shareText} ${pageUrl}`.trim());
                    }}
                    className="rounded-full border px-3.5 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Only if you like. Sharing it helps {formConfig.workspace.name}, and others can leave theirs the same way.
                </p>
              </div>
            )}

            {isTestimonialForm && (
              <div className="mt-6 border-t pt-5">
                <p className="text-sm text-muted-foreground">
                  Do you run a business? Collect testimonials like this for yours.
                </p>
                <a
                  href="https://testimoni.io/signup?src=thank_you"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("thank_you_signup_clicked", { workspace_name: formConfig.workspace.name }, { anonymous: true })}
                  className="mt-2 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Create your free Wall of Love &rarr;
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {formConfig.workspace.logoUrl && (
            <img
              src={formConfig.workspace.logoUrl}
              alt={formConfig.workspace.name}
              className="mx-auto mb-4 h-12 w-12 rounded-full object-cover"
            />
          )}
          <CardTitle className="text-2xl">{formConfig.headline}</CardTitle>
          {formConfig.description && (
            <CardDescription>{formConfig.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formConfig.allowRating && (
              <div>
                <Label>Rating *</Label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="content">{contentLabel} *</Label>
              <Textarea
                id="content"
                placeholder={contentPlaceholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                minLength={20}
              />
              {/* Both Rating and the message are marked required with *,
                  but only ONE needs a value. Adding the shared footnote
                  here (below the second of the two fields) so users see
                  it before they scroll to the submit button. */}
              <p className="mt-1 text-xs text-muted-foreground">
                * Provide at least one — stars, {contentLabel.toLowerCase()}, or
                both. Minimum 20 characters if you write a message.
              </p>
              {/* Writer's-block bridge — anonymous form fillers
                  often stare at the blank box. Suggest our
                  testimonial writer tool as a warm on-ramp; opens
                  in a new tab so they don't lose this form's state.
                  UTM-tagged so we can see if the bridge converts
                  (both to a completed form + a signup on the tool
                  page). */}
              <p className="mt-2 text-xs text-muted-foreground">
                Stuck on what to write?{" "}
                <a
                  href="/tools/testimonial-writer?utm_source=collect_form&utm_medium=writers_block_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  Get 3 draft options →
                </a>{" "}
                (free, no signup)
              </p>
            </div>

            {/* Honeypot — labelled "Website" but hidden from human
                view via CSS. Bots that auto-fill every input by
                name trip this and the server rejects them silently.
                aria-hidden + tabIndex -1 + autoComplete off makes
                sure screen readers + keyboard users skip past it. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label htmlFor="website-url">Website</label>
              <input
                id="website-url"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Your name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="jobTitle">Job title / role (optional)</Label>
              <Input
                id="jobTitle"
                placeholder="e.g. CEO at Acme, or Marketing Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Testimonial"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Powered by Testimoni
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Coarse-grained bucketing for testimonial length so analytics can
 * see "did they write anything meaningful?" without shipping any of
 * the actual text. Buckets are ranges, not exact counts.
 */
function bucketTextLength(len: number): "0" | "1-40" | "41-120" | "121-300" | "300+" {
  if (len === 0) return "0";
  if (len <= 40) return "1-40";
  if (len <= 120) return "41-120";
  if (len <= 300) return "121-300";
  return "300+";
}
