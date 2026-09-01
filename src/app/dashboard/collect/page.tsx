"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/lib/use-subscription";
import { LimitBanner } from "@/components/plan/limit-banner";
import {
  Plus,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  Code,
  Mail,
  QrCode,
  Frame,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CollectionForm {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  headline: string;
  createdAt: string;
  workspace: { slug: string };
  _count: { submissions: number };
}

export default function CollectPage() {
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const [forms, setForms] = useState<CollectionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(isWelcome);
  // Pre-fill with a sensible default so hitting Enter after "New form"
  // creates a working form in one keystroke.
  const [newName, setNewName] = useState("Customer Feedback");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const { plan, limits } = useSubscription();
  const atLimit = forms.length >= limits.maxForms;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/submissions?listForms=true")
      .then((r) => r.json())
      .then((data) => {
        const list = data.forms || [];
        setForms(list);
        // Auto-expand the first (default) form's share section so
        // Free-plan users - who have exactly one form - see the
        // share links + embed code without having to click Share.
        // Pro users with multiple forms still get the first one
        // pre-expanded, others collapsed.
        if (list.length > 0) {
          setExpanded(list[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createForm", name: newName }),
      });
      if (res.ok) {
        const data = await res.json();
        setForms((prev) => [data.form, ...prev]);
        setNewName("Customer Feedback");
        setShowCreate(false);
        track("form_created", { formId: data.form?.id, name: newName });
      } else {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || "Could not create form. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  function getFormUrl(form: CollectionForm) {
    return `${origin}/collect/${form.workspace.slug}/${form.slug}`;
  }

  function getEmbedScript(form: CollectionForm) {
    return `<script src="${origin}/embed/collect.js" data-form-id="${form.id}"></script>`;
  }

  function getIframeCode(form: CollectionForm) {
    return `<iframe src="${getFormUrl(form)}" width="100%" height="720" frameborder="0" style="border: none; border-radius: 12px;"></iframe>`;
  }

  function getEmailTemplate(form: CollectionForm) {
    return `Hi [Name],\n\nWe'd love to hear about your experience with us! Could you share a quick testimonial?\n\nIt only takes 30 seconds: ${getFormUrl(form)}\n\nThank you so much!\n[Your Name]`;
  }

  function getQrUrl(form: CollectionForm) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getFormUrl(form))}`;
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    // Any copy of a share URL / embed / iframe / email counts as
    // "form_published" — the moment the user makes their form
    // reachable outside the dashboard.
    const [channel, formId] = key.split("-");
    track("form_published", { channel, formId });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Collection Forms</h1>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "link", label: "Share Link", icon: LinkIcon },
    { id: "embed", label: "Embed Script", icon: Code },
    { id: "iframe", label: "iFrame", icon: Frame },
    { id: "email", label: "Email", icon: Mail },
    { id: "qr", label: "QR Code", icon: QrCode },
  ];

  return (
    <div className="space-y-6">
      {isWelcome && forms.length === 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-lg font-semibold">Welcome to Testimoni 👋</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Let&apos;s create your first collection form. Give it a name, share it with
            customers, and their testimonials will land in your inbox for one-click approval.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collect Feedback</h1>
          <p className="text-muted-foreground">
            Choose how you want to gather testimonials from customers
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          disabled={atLimit}
          title={atLimit ? "Free plan is limited to 1 form. Upgrade to Pro." : undefined}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Form
        </Button>
      </div>

      {atLimit && plan === "FREE" && (
        <LimitBanner
          resource="collection form"
          usage={`${forms.length} / ${limits.maxForms}`}
          description="Pro unlocks unlimited forms so you can collect testimonials from different channels (post-purchase, onboarding, support)."
        />
      )}

      {showCreate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="form-name">Form Name</Label>
                <Input
                  id="form-name"
                  placeholder="e.g., Customer Feedback"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
            {createError && (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{createError}</p>
                {createError.toLowerCase().includes("limit") && (
                  <a
                    href="/dashboard/settings/billing"
                    className="mt-1 inline-block text-xs font-semibold text-destructive underline"
                  >
                    Upgrade to Pro →
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {forms.length === 0 && !showCreate ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No collection forms yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a form to unlock 5 ways to collect testimonials.
            </p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => {
            const isOpen = expanded === form.id;
            const currentTab = activeTab[form.id] || "link";

            return (
              <Card key={form.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{form.name}</h3>
                        <Badge variant={form.isActive ? "default" : "secondary"}>
                          {form.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {form._count?.submissions || 0} submissions
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={getFormUrl(form)} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Preview
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setExpanded(isOpen ? null : form.id)}
                      >
                        {isOpen ? (
                          <>
                            <ChevronUp className="mr-1 h-3 w-3" /> Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1 h-3 w-3" /> Share
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-6 border-t pt-4">
                      <div className="mb-4 flex flex-wrap gap-2">
                        {tabs.map((t) => {
                          const Icon = t.icon;
                          const active = currentTab === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() =>
                                setActiveTab((prev) => ({ ...prev, [form.id]: t.id }))
                              }
                              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/70"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {t.label}
                            </button>
                          );
                        })}
                      </div>

                      {currentTab === "link" && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Share this URL anywhere &mdash; email, Slack, DM, or link-in-bio.
                          </p>
                          <div className="flex gap-2">
                            <Input readOnly value={getFormUrl(form)} className="font-mono text-xs" />
                            <Button
                              size="sm"
                              onClick={() => copy(getFormUrl(form), `link-${form.id}`)}
                            >
                              {copiedKey === `link-${form.id}` ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentTab === "embed" && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Adds a floating &ldquo;Leave a Review&rdquo; button to any website. Paste before <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code>.
                          </p>
                          <div className="relative">
                            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                              <code>{getEmbedScript(form)}</code>
                            </pre>
                            <Button
                              size="sm"
                              className="absolute right-2 top-2"
                              onClick={() => copy(getEmbedScript(form), `embed-${form.id}`)}
                            >
                              {copiedKey === `embed-${form.id}` ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentTab === "iframe" && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Embed the full form directly into a page &mdash; great for dedicated feedback sections.
                          </p>
                          <div className="relative">
                            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                              <code>{getIframeCode(form)}</code>
                            </pre>
                            <Button
                              size="sm"
                              className="absolute right-2 top-2"
                              onClick={() => copy(getIframeCode(form), `iframe-${form.id}`)}
                            >
                              {copiedKey === `iframe-${form.id}` ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentTab === "email" && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Copy this template to send in follow-up emails after a purchase or interaction.
                          </p>
                          <div className="relative">
                            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                              <code>{getEmailTemplate(form)}</code>
                            </pre>
                            <Button
                              size="sm"
                              className="absolute right-2 top-2"
                              onClick={() => copy(getEmailTemplate(form), `email-${form.id}`)}
                            >
                              {copiedKey === `email-${form.id}` ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentTab === "qr" && (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Print on receipts, packaging, business cards, or table tents. Customers scan &rarr; submit.
                          </p>
                          <div className="flex items-start gap-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getQrUrl(form)}
                              alt="QR code"
                              className="rounded-md border bg-white p-2"
                              width={180}
                              height={180}
                            />
                            <div className="flex-1 space-y-2">
                              <Button size="sm" variant="outline" asChild>
                                <a href={getQrUrl(form)} download={`qr-${form.slug}.png`}>
                                  Download PNG
                                </a>
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                QR points to:<br />
                                <span className="font-mono">{getFormUrl(form)}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
