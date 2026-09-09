"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, Copy, Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";
import type { PlanType } from "@/lib/constants";

type Props = {
  initialActive: boolean;
  workspaceSlug: string;
  plan: PlanType;
  testimonialCount: number;
  baseUrl: string;
};

export function AskMyWallClient({ initialActive, workspaceSlug, plan, testimonialCount, baseUrl }: Props) {
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

      {plan === "FREE" ? (
        <UpgradeGate />
      ) : (
        <>
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

function UpgradeGate() {
  return (
    <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Pro feature</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Ask My Wall answers visitor questions using your real customer testimonials — grounded, cited, never made-up. Included in Pro at $9/mo.
      </p>
      <Link href="/pricing" className="mt-4 inline-block">
        <Button>Upgrade to Pro</Button>
      </Link>
    </div>
  );
}
