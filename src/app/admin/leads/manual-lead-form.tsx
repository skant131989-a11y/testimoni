"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Manual outreach entry point — add a website you already have in
 * mind (not something a scan found) and jump straight to the same
 * prepare/preview/send flow every other lead uses. Creates a Lead
 * (source MANUAL) via /api/admin/leads/manual, then just refreshes
 * the page — the new card shows up in "Best Prospects" like any
 * other lead, so no separate send UI needed here.
 */
export function ManualLeadForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/leads/manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ website, email, details }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(data.error || "Could not add that lead.");
        return;
      }
      setResult("Added — find it in Best Prospects below to prepare and send.");
      setWebsite("");
      setEmail("");
      setDetails("");
      router.refresh();
    } catch {
      setResult("Could not add that lead — network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold"
      >
        <span className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add a lead manually
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground sm:col-span-1">
            Website URL
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="acme.com"
              required
              className="mt-0.5"
            />
          </label>
          <label className="text-xs text-muted-foreground sm:col-span-1">
            Email (optional — we&rsquo;ll also try to find one on their site)
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@acme.com"
              className="mt-0.5"
            />
          </label>
          <label className="text-xs text-muted-foreground sm:col-span-2">
            Website details (optional — context for the email draft, not a customer quote)
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="e.g. project management tool for freelance designers, just launched"
              className="mt-0.5 w-full rounded border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Button type="submit" size="sm" disabled={submitting || !website.trim()}>
              {submitting ? "Adding…" : "Add lead"}
            </Button>
            {result && <p className="text-xs text-muted-foreground">{result}</p>}
          </div>
        </form>
      )}
    </div>
  );
}
