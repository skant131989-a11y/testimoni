"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, Copy, Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";
import { UpgradeProButton } from "@/components/upgrade-pro-button";
import type { PlanType } from "@/lib/constants";

type Props = {
  initialActive: boolean;
  workspaceSlug: string;
  plan: PlanType;
  testimonialCount: number;
  baseUrl: string;
  /** Free workspaces: answers used this month and the monthly allowance. */
  answersUsed?: number;
  answersLimit?: number | null;
};

export function AskMyWallClient({
  initialActive,
  workspaceSlug,
  plan,
  testimonialCount,
  baseUrl,
  answersUsed = 0,
  answersLimit = null,
}: Props) {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snippet = `<script src="${baseUrl}/embed/ask.js" data-workspace="${workspaceSlug}" async></script>`;

  async function toggle(next: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/ask-my-wall/config", {
        method: next ? "POST" : "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed");
        return;
      }
      setActive(next);
      track("ask_my_wall_toggled", { active: next });
    });
  }

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const enoughTestimonials = testimonialCount >= 5;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Ask My Wall</h1>
      </div>
      <p className="text-muted-foreground">
        An AI chatbot bubble you embed on your site. Visitors ask questions; it answers using your real testimonials — never invents.
      </p>

      {(
        <>
          {plan === "FREE" && answersLimit !== null && (
            <AnswerMeter used={answersUsed} limit={answersLimit} />
          )}
          {error && (
            <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <div className="mt-6 rounded-2xl border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Status</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {active ? "Live — visitors can chat right now." : "Off — the embed script returns a friendly message until enabled."}
                </p>
                {!enoughTestimonials && (
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    Only {testimonialCount} approved testimonials — the bot needs at least 5 for useful answers. Approve more in Inbox.
                  </p>
                )}
              </div>
              <Button
                onClick={() => toggle(!active)}
                disabled={pending}
                variant={active ? "outline" : "default"}
              >
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {active ? "Turn off" : "Enable Ask My Wall"}
              </Button>
            </div>
          </div>

          {active && (
            <div className="mt-6 rounded-2xl border bg-card p-6">
              <h2 className="text-lg font-semibold">Embed on your site</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste this one line before the closing <code className="rounded bg-muted px-1">&lt;/body&gt;</code> tag. The chat bubble appears in the bottom-right corner.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <pre className="flex-1 overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
                  <code>{snippet}</code>
                </pre>
                <Button variant="outline" size="sm" onClick={copySnippet}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border bg-muted/30 p-6">
            <h2 className="text-lg font-semibold">Try it right here</h2>
            <p className="mt-1 text-sm text-muted-foreground">The bubble in the bottom-right is the live widget for this workspace.</p>
          </div>

          {active && (
            <script
              async
              src={`${baseUrl}/embed/ask.js`}
              data-workspace={workspaceSlug}
            />
          )}
        </>
      )}
    </div>
  );
}

function AnswerMeter({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const out = used >= limit;
  return (
    <>
      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Free plan: {limit} answers a month</p>
          <p className="text-sm text-muted-foreground">
            {Math.min(used, limit)} of {limit} used
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/15">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Free answers quote your closest testimonials. Pro writes full answers with AI and has no limit. Resets on the 1st.
        </p>
      </div>
      {(out || pct >= 80) && <UpgradeGate exhausted={out} />}
    </>
  );
}

function UpgradeGate({ exhausted = false }: { exhausted?: boolean }) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {exhausted ? "You've used this month's free answers" : "Almost at this month's free answers"}
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {exhausted
          ? "Visitors see a short \u201ccheck back soon\u201d message until the 1st. Pro has no limit on answers, for $19/mo."
          : "Pro has no limit on answers, so your chatbot never goes quiet. $19/mo."}
      </p>

      <div className="mt-5 rounded-xl border bg-background p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Example conversation
        </p>
        <div className="mt-3 space-y-2 text-sm">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
            How long does setup take?
          </div>
          <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm border bg-muted/40 px-3 py-2">
            Customers say it is quick: &ldquo;Setup took ten minutes,&rdquo; says Alex P., one of the people on this wall.
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          It only uses your approved testimonials and always names who said it.
        </p>
      </div>

      <Link href="/pricing" className="mt-4 inline-block">
        <Button variant="link" className="h-auto p-0 text-sm">See what&rsquo;s in Pro →</Button>
      </Link>
      <div className="mt-4">
        <UpgradeProButton surface="ask_my_wall_upgrade_card" />
      </div>
    </div>
  );
}
