"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function ReviewActions({ token, status }: { token: string; status: string }) {
  const [state, setState] = useState<"idle" | "busy" | "approved" | "rejected" | "error">(
    status === "APPROVED" ? "approved" : status === "REJECTED" ? "rejected" : "idle"
  );
  const [message, setMessage] = useState("");
  const [wallId, setWallId] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setState("busy");
    setMessage("");
    try {
      const res = await fetch(`/api/review/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        track("email_review_action", { action });
        setWallId(data.wallId ?? null);
        setState(action === "approve" ? "approved" : "rejected");
        return;
      }
      if (res.status === 409) {
        setState(data.status === "APPROVED" ? "approved" : "rejected");
        return;
      }
      setMessage(data.error || "Couldn't do that. Open your inbox to finish.");
      setState("error");
    } catch {
      setMessage("Network hiccup. Try again.");
      setState("error");
    }
  }

  if (state === "approved") {
    return (
      <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5" /> It&apos;s on your wall.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
          {wallId && (
            <Link href={`/w/${wallId}`} className="text-emerald-800 underline-offset-4 hover:underline">
              See your wall
            </Link>
          )}
          <Link href="/dashboard" className="text-emerald-800 underline-offset-4 hover:underline">
            Open dashboard
          </Link>
        </div>
      </div>
    );
  }
  if (state === "rejected") {
    return <p className="mt-5 rounded-xl bg-muted p-4 text-sm">Rejected. It won&apos;t appear on your wall.</p>;
  }

  return (
    <div className="mt-5">
      <div className="flex gap-3">
        <Button className="flex-1" size="lg" onClick={() => act("approve")} disabled={state === "busy"}>
          {state === "busy" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Approve
        </Button>
        <Button className="flex-1" size="lg" variant="outline" onClick={() => act("reject")} disabled={state === "busy"}>
          Reject
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-destructive">{message}</p>}
    </div>
  );
}
