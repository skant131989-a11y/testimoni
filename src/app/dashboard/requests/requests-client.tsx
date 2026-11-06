"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Mail, RefreshCw, Send, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { track } from "@/lib/analytics";
import { UpgradeNudge } from "@/components/upgrade/upgrade-nudge";

type Row = {
  id: string;
  email: string;
  name: string | null;
  status: "QUEUED" | "SENT" | "SUBMITTED" | "UNSUBSCRIBED" | "FAILED";
  source: string;
  sentAt: string | null;
  reminded: boolean;
  createdAt: string;
};

const STATUS_LABEL: Record<Row["status"], string> = {
  QUEUED: "Scheduled",
  SENT: "Sent",
  SUBMITTED: "Replied",
  UNSUBSCRIBED: "Opted out",
  FAILED: "Failed",
};

export function RequestsClient({
  baseUrl,
  initialSecret,
  isFree,
  limit,
  used,
  rows,
}: {
  baseUrl: string;
  initialSecret: string;
  isFree: boolean;
  limit: number | null;
  used: number;
  rows: Row[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [delay, setDelay] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [secret, setSecret] = useState(initialSecret);
  const [copied, setCopied] = useState<string | null>(null);

  const hookUrl = `${baseUrl}/api/hooks/request/${secret}`;
  const curl = `curl -X POST ${hookUrl} \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"ana@example.com","name":"Ana","delay_days":3}'`;
  const left = limit === null ? null : Math.max(limit - used, 0);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function send() {
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: text, delayDays: delay }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Something went wrong.");
        return;
      }
      track("requests_sent", { queued: data.queued, sent: data.sent, delay });
      const parts = [
        data.sent ? `${data.sent} sent` : null,
        data.queued && delay > 0 ? `${data.queued} scheduled` : null,
        data.skipped?.length ? `${data.skipped.length} skipped (${data.skipped[0].reason}${data.skipped.length > 1 ? ", …" : ""})` : null,
        data.limitReached ? "monthly limit reached" : null,
      ].filter(Boolean);
      setMessage(parts.join(" · ") || "Nothing to send.");
      if (data.queued > 0) setText("");
      router.refresh();
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function rotate() {
    if (!confirm("Create a new webhook URL? The old one will stop working.")) return;
    const res = await fetch("/api/requests/hook", { method: "POST" });
    const data = await res.json();
    if (res.ok) setSecret(data.secret);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Requests</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Ask customers for a testimonial. They get an email with a link to your form, plus one reminder
          after about 5 days if they haven&rsquo;t replied.
        </p>
        {left !== null && (
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {left} of {limit}
            </span>{" "}
            requests left this month
          </p>
        )}
      </div>

      {isFree && left !== null && left <= 3 && (
        <UpgradeNudge surface="requests_limit" title="You're nearly out of free requests this month">
          Pro sends up to 500 a month, so you can ask every customer.
        </UpgradeNudge>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={"ana@example.com\nBen Carter <ben@example.com>\ncara@example.com, Cara"}
            className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Send
              <select
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="rounded-md border bg-background px-2 py-1 text-sm"
              >
                <option value={0}>now</option>
                <option value={1}>in 1 day</option>
                <option value={3}>in 3 days</option>
                <option value={7}>in 7 days</option>
              </select>
            </label>
            <Button onClick={send} disabled={sending || text.trim().length < 3}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send requests
            </Button>
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            One address per line, up to 50 at a time. We skip anyone you asked in the last 90 days,
            anyone who already submitted, and anyone who opted out.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Automate it
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Call this URL when something good happens: a purchase in Stripe, Shopify or Gumroad, a closed
            support ticket, a high NPS score. Use Zapier or Make (a &ldquo;Webhooks&rdquo; step), or your own
            code.
          </p>
          <div className="flex items-start gap-2">
            <code className="flex-1 break-all rounded-lg border bg-muted p-3 text-xs text-foreground">{hookUrl}</code>
            <Button variant="outline" size="sm" onClick={() => copy("url", hookUrl)}>
              {copied === "url" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied === "url" ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex items-start gap-2">
            <pre className="flex-1 overflow-x-auto rounded-lg border bg-muted p-3 text-xs text-foreground">
              <code>{curl}</code>
            </pre>
            <Button variant="outline" size="sm" onClick={() => copy("curl", curl)}>
              {copied === "curl" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied === "curl" ? "Copied" : "Copy"}
            </Button>
          </div>
          <p>
            <code className="rounded bg-muted px-1">delay_days</code> (0–30) is optional. Treat the URL like a
            password.{" "}
            <button onClick={rotate} className="inline-flex items-center gap-1 text-primary hover:underline">
              <RefreshCw className="h-3 w-3" /> Make a new URL
            </button>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent requests</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name ? `${r.name} · ` : ""}{r.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.source === "webhook" ? "Webhook" : "Added by hand"} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                      {r.reminded ? " · reminder sent" : ""}
                    </p>
                  </div>
                  <Badge variant={r.status === "SUBMITTED" ? "default" : r.status === "FAILED" ? "destructive" : "secondary"}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
