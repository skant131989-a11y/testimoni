"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Twitter,
  Linkedin,
  AlertCircle,
} from "lucide-react";
import { track } from "@/lib/analytics";
import { UpgradeProButton } from "@/components/upgrade-pro-button";
import type { PlanType } from "@/lib/constants";

type Testimonial = {
  id: string;
  content: string;
  customerName: string;
  customerTitle: string | null;
  customerAvatar: string | null;
  source: string;
  createdAt: string;
};

type Draft = { style: string; text: string };

type Props = {
  testimonials: Testimonial[];
  plan: PlanType;
  socialAccounts: { provider: "TWITTER" | "LINKEDIN"; handle: string }[];
  autoPostEnabled: boolean;
  providerConfig: { twitter: boolean; linkedin: boolean };
};

export function TweetDraftsClient({ testimonials, plan, socialAccounts, autoPostEnabled, providerConfig }: Props) {
  const params = useSearchParams();
  const router = useRouter();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [postingKey, setPostingKey] = useState<string | null>(null);
  const [posted, setPosted] = useState<Record<string, string>>({});

  const oauthError = params.get("oauth_error");
  const connected = params.get("connected");

  useEffect(() => {
    if (connected) {
      router.replace("/dashboard/tweet-drafts");
    }
  }, [connected, router]);

  const twitterConnected = socialAccounts.find((a) => a.provider === "TWITTER");
  const linkedinConnected = socialAccounts.find((a) => a.provider === "LINKEDIN");

  async function generate(id: string) {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/testimonials/${id}/tweet-drafts`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "Generation failed");
        return;
      }
      setDrafts((prev) => ({ ...prev, [id]: data.drafts }));
      setExpandedId(id);
      track("tweet_drafts_generated", { testimonial_id: id });
    } finally {
      setLoadingId(null);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  }

  function openIntent(provider: "twitter" | "linkedin", text: string) {
    const encoded = encodeURIComponent(text);
    const url =
      provider === "twitter"
        ? `https://twitter.com/intent/tweet?text=${encoded}`
        : `https://www.linkedin.com/sharing/share-offsite/?text=${encoded}`;
    window.open(url, "_blank", "noopener");
  }

  async function autoPost(provider: "TWITTER" | "LINKEDIN", text: string, draftKey: string) {
    setPostingKey(draftKey);
    setError(null);
    try {
      const res = await fetch("/api/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Post failed");
        return;
      }
      setPosted((prev) => ({ ...prev, [draftKey]: data.postUrl }));
      track("social_posted", { provider });
    } finally {
      setPostingKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Testimonial → Tweet</h1>
        <p className="mt-2 text-muted-foreground">
          Each approved testimonial becomes 3 tweet drafts. Copy, open compose,
          or auto-post to X / LinkedIn.
        </p>
      </div>

      {oauthError && (
        <ErrorBanner message={`OAuth failed: ${oauthError}`} onDismiss={() => router.replace("/dashboard/tweet-drafts")} />
      )}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {autoPostEnabled && (
        <ConnectionBar
          twitterConnected={twitterConnected}
          linkedinConnected={linkedinConnected}
          providerConfig={providerConfig}
        />
      )}
      {testimonials.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="mt-6 space-y-4">
          {testimonials.map((t) => (
            <li key={t.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                {t.customerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.customerAvatar} alt="" className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {t.customerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium text-sm">
                      {t.customerName}
                      {t.customerTitle && <span className="text-muted-foreground font-normal"> · {t.customerTitle}</span>}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-foreground/80 line-clamp-3">{t.content}</p>

                  <div className="mt-3 flex items-center gap-2">
                    {!drafts[t.id] ? (
                      <Button size="sm" onClick={() => generate(t.id)} disabled={loadingId === t.id}>
                        {loadingId === t.id ? (
                          <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</>
                        ) : (
                          <><Sparkles className="mr-2 h-3.5 w-3.5" />Generate 3 drafts</>
                        )}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                        {expandedId === t.id ? "Hide drafts" : "Show drafts"}
                      </Button>
                    )}
                  </div>

                  {expandedId === t.id && drafts[t.id] && (
                    <div className="mt-4 space-y-3 border-l-2 border-primary/30 pl-4">
                      {drafts[t.id].map((d, i) => {
                        const draftKey = `${t.id}:${i}`;
                        const postedUrl = posted[draftKey];
                        return (
                          <div key={i} className="rounded-lg border bg-background p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{d.style}</p>
                            <p className="mt-1.5 text-sm whitespace-pre-wrap">{d.text}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{d.text.length} chars</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => copyText(d.text)}
                                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted"
                              >
                                {copiedText === d.text ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                {copiedText === d.text ? "Copied" : "Copy"}
                              </button>

                              {autoPostEnabled && twitterConnected ? (
                                <button
                                  onClick={() => autoPost("TWITTER", d.text, draftKey)}
                                  disabled={postingKey === draftKey}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-sky-500 bg-sky-50 px-2.5 py-1 text-xs text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                                >
                                  <Twitter className="h-3 w-3" />
                                  {postingKey === draftKey ? "Posting…" : "Post to X"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => openIntent("twitter", d.text)}
                                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted"
                                >
                                  <Twitter className="h-3 w-3" />
                                  Open in X
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              )}

                              {autoPostEnabled && linkedinConnected ? (
                                <button
                                  onClick={() => autoPost("LINKEDIN", d.text, draftKey)}
                                  disabled={postingKey === draftKey}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-600 bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                >
                                  <Linkedin className="h-3 w-3" />
                                  {postingKey === draftKey ? "Posting…" : "Post to LinkedIn"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => openIntent("linkedin", d.text)}
                                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted"
                                >
                                  <Linkedin className="h-3 w-3" />
                                  Open in LinkedIn
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              )}

                              {postedUrl && (
                                <a href={postedUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                                  <Check className="h-3 w-3" /> Posted — view
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {plan === "FREE" && (
        <div className="mt-8 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold">Unlimited tweet drafts on Pro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Free plan: 5 tweet drafts / month. Pro plan: unlimited drafts, one click to X or LinkedIn compose.
          </p>
          <Link href="/pricing" className="mt-4 inline-block">
            <Button variant="link" className="h-auto p-0 text-sm">See what&rsquo;s in Pro →</Button>
          </Link>
          <div className="mt-4">
            <UpgradeProButton surface="tweet_drafts_upgrade_card" label="Upgrade to Pro — $9/mo" />
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <p className="flex-1 text-destructive">{message}</p>
      <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
    </div>
  );
}

function ConnectionBar({
  twitterConnected,
  linkedinConnected,
  providerConfig,
}: {
  twitterConnected: { handle: string } | undefined;
  linkedinConnected: { handle: string } | undefined;
  providerConfig: { twitter: boolean; linkedin: boolean };
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Connected accounts</p>
      <div className="flex flex-wrap items-center gap-3">
        {twitterConnected ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500 bg-sky-50 px-3 py-1 text-sm text-sky-700">
            <Twitter className="h-3.5 w-3.5" />
            {twitterConnected.handle}
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : providerConfig.twitter ? (
          <a
            href="/api/oauth/twitter/start"
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-muted"
          >
            <Twitter className="h-3.5 w-3.5" /> Connect X
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-dashed px-3 py-1 text-sm text-muted-foreground">
            <Twitter className="h-3.5 w-3.5" /> X — setup required
          </span>
        )}

        {linkedinConnected ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-600 bg-blue-50 px-3 py-1 text-sm text-blue-700">
            <Linkedin className="h-3.5 w-3.5" />
            {linkedinConnected.handle}
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : providerConfig.linkedin ? (
          <a
            href="/api/oauth/linkedin/start"
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-muted"
          >
            <Linkedin className="h-3.5 w-3.5" /> Connect LinkedIn
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-dashed px-3 py-1 text-sm text-muted-foreground">
            <Linkedin className="h-3.5 w-3.5" /> LinkedIn — setup required
          </span>
        )}
      </div>
      {(!providerConfig.twitter || !providerConfig.linkedin) && (
        <p className="mt-2 text-xs text-muted-foreground">
          Not connected? <span className="font-medium">Copy</span> and <span className="font-medium">Open in X/LinkedIn</span> work
          today. One-click auto-post activates once OAuth is set up.
        </p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed p-12 text-center">
      <p className="text-muted-foreground">No approved testimonials yet. Approve a few in Inbox, then come back to turn them into tweets.</p>
    </div>
  );
}
