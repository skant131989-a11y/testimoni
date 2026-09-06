"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";

/**
 * Reusable "Email me this" button + inline form for public tools.
 *
 * Compact — sits alongside the tool's existing Download / Copy /
 * Save buttons. Click reveals a small inline row with an email
 * input; submit fires POST /api/tools/email-me-this and shows a
 * success confirmation without changing the surrounding layout.
 *
 * Analytics events:
 *   - tool_email_me_opened  — user clicked the trigger
 *   - tool_email_me_sent    — successful send
 *   - tool_email_me_failed  — server rejected
 */

type Tool =
  | "testimonial-card"
  | "testimonial-writer"
  | "ask-templates"
  | "linkedin-recommendation"
  | "star-badge";

interface Props {
  tool: Tool;
  /** Text or a serializable string representation of what to send. */
  getContent: () => string;
  /** Optional back-link included in the email (deep-link to the tool). */
  backLink?: string;
  /** Optional wrapper className. Default styles the whole component
   *  as an inline row that sits next to Download/Copy buttons. */
  className?: string;
  /** "prominent" (default) renders as an outlined equal-weight Button
   *  next to Download. "compact" renders as a small text link — use
   *  when the trigger sits inside a dense variants list. */
  variant?: "prominent" | "compact";
  /** Optional button size override (default "lg" for prominent, unused
   *  for compact). Matches the primary Download button's size on each
   *  tool page so they read as equal actions. */
  size?: "sm" | "default" | "lg";
}

export function EmailMeThis({
  tool,
  getContent,
  backLink,
  className = "",
  variant = "prominent",
  size = "lg",
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTriggerClick() {
    track("tool_email_me_opened", { tool });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/tools/email-me-this", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          tool,
          content: getContent(),
          backLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send. Try again.");
        track("tool_email_me_failed", { tool, error: data.error });
        return;
      }
      setSent(true);
      track("tool_email_me_sent", { tool });
    } catch {
      setError("Network error. Try again.");
      track("tool_email_me_failed", { tool, error: "network" });
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    if (variant === "compact") {
      return (
        <button
          type="button"
          onClick={handleTriggerClick}
          className={`inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary hover:underline ${className}`}
        >
          <Mail className="h-3.5 w-3.5" />
          or email it to me
        </button>
      );
    }
    // Prominent — equal-weight PRIMARY-color button that sits next
    // to the tool's Download / Copy row. Reads as an equal action to
    // Download so users capture their output via email as often as
    // they download. Colored (not outlined) so it doesn't fade.
    // "Email me" (8 chars) chosen over longer variants so the button
    // fits inside narrow tool columns (~180px each in a 2-button row)
    // without overflowing its parent container.
    return (
      <Button
        type="button"
        size={size}
        onClick={handleTriggerClick}
        className={`min-w-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
      >
        <Mail className="h-4 w-4" />
        Email me
      </Button>
    );
  }

  if (sent) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary ${className}`}
      >
        <Check className="h-3.5 w-3.5" />
        Sent to {email} — check your inbox
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-2 rounded-md border bg-muted/40 p-2 sm:flex-row ${className}`}
    >
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-9 flex-1 text-sm"
        required
        autoFocus
      />
      <Button type="submit" size="sm" disabled={sending || !email.trim()} className="h-9 gap-1.5">
        {sending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Mail className="h-3.5 w-3.5" />
            Send
          </>
        )}
      </Button>
      {error && (
        <p className="basis-full text-xs text-destructive">{error}</p>
      )}
    </form>
  );
}
