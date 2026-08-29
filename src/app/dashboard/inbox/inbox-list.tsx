"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Star, Mail, ArrowRight, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LimitBanner } from "@/components/plan/limit-banner";
import { cn } from "@/lib/utils";

export interface InboxSubmission {
  id: string;
  customerName: string;
  customerEmail: string | null;
  content: string | null;
  rating: number | null;
  createdAt: string;
  formName: string;
}

interface InboxListProps {
  initial: InboxSubmission[];
  activeFilter: "NEW" | "APPROVED" | "REJECTED";
  atTestimonialLimit: boolean;
  testimonialCount: number;
  maxTestimonials: number;
  isFree: boolean;
}

export function InboxList({
  initial,
  activeFilter,
  atTestimonialLimit: initialAtLimit,
  testimonialCount: initialCount,
  maxTestimonials,
  isFree,
}: InboxListProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initial);
  const [testimonialCount, setTestimonialCount] = useState(initialCount);
  const [atLimit, setAtLimit] = useState(initialAtLimit);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [confirmations, setConfirmations] = useState<
    { key: string; message: string; widgetId?: string }[]
  >([]);
  const [isRefreshing, startTransition] = useTransition();

  function pushConfirmation(message: string, widgetId?: string) {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setConfirmations((c) => [...c, { key, message, widgetId }]);
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setConfirmations((c) => c.filter((x) => x.key !== key));
    }, 6000);
  }

  async function handleAction(
    id: string,
    action: "approve" | "reject",
    customerName: string
  ): Promise<void> {
    setError(null);
    // Optimistically remove from the list
    const previous = submissions;
    setSubmissions((s) => s.filter((sub) => sub.id !== id));
    setPendingIds((p) => new Set(p).add(id));

    try {
      const res = await fetch(`/api/submissions/${id}/${action}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Revert on error
        setSubmissions(previous);
        if (res.status === 403) {
          setAtLimit(true);
          setError(data.error || "Testimonial limit reached.");
        } else {
          setError(data.error || `Could not ${action}. Try again.`);
        }
        return;
      }
      if (action === "approve") {
        setTestimonialCount((n) => n + 1);
        if (testimonialCount + 1 >= maxTestimonials) setAtLimit(true);
        const widget = data.widget as { id: string; name: string } | null | undefined;
        pushConfirmation(
          widget
            ? `Approved ${customerName}. Added to “${widget.name}”.`
            : `Approved ${customerName}. Added to your library.`,
          widget?.id
        );
      } else {
        pushConfirmation(`Rejected ${customerName}.`);
      }
      // Refresh tab counts (NEW → APPROVED etc.) without a full navigation
      startTransition(() => router.refresh());
    } catch {
      setSubmissions(previous);
      setError(`Could not ${action}. Try again.`);
    } finally {
      setPendingIds((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-3">
      {atLimit && isFree && activeFilter === "NEW" && (
        <LimitBanner
          resource="testimonials"
          usage={`${testimonialCount} / ${maxTestimonials}`}
          description="You've collected the max testimonials on Free. Upgrade to Pro to keep approving new submissions."
        />
      )}

      {confirmations.length > 0 && (
        <div className="space-y-2">
          {confirmations.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm"
            >
              <p className="flex items-center gap-2 font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                {c.message}
              </p>
              {c.widgetId && (
                <div className="flex gap-1">
                  <Button asChild size="sm" variant="ghost">
                    <a
                      href={`/w/${c.widgetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View wall <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/widgets/${c.widgetId}`}>
                      Edit widget <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {activeFilter === "NEW"
                ? "Inbox zero! No pending submissions to review."
                : `No ${activeFilter.toLowerCase()} submissions yet.`}
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/dashboard/collect">
                Get share links & embed code
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        submissions.map((s) => (
          <Card
            key={s.id}
            className={cn(
              "transition-opacity",
              pendingIds.has(s.id) && "opacity-50"
            )}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {s.customerName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{s.customerName}</p>
                  {s.customerEmail && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {s.customerEmail}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    via {s.formName}
                  </Badge>
                </div>

                {s.rating && (
                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < s.rating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                )}

                <p className="mt-1.5 text-sm text-muted-foreground">
                  {s.content || <em>No text content</em>}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <time className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString()}
                </time>
                {activeFilter === "NEW" && (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1"
                      title={
                        atLimit
                          ? "Testimonial limit reached — upgrade to Pro"
                          : "Approve and add to testimonials"
                      }
                      disabled={atLimit || pendingIds.has(s.id) || isRefreshing}
                      onClick={() => handleAction(s.id, "approve", s.customerName)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      title="Reject"
                      disabled={pendingIds.has(s.id) || isRefreshing}
                      onClick={() => handleAction(s.id, "reject", s.customerName)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
