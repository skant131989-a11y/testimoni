"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function RunScanButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    track("admin_leads_scan_started", {});
    try {
      const res = await fetch("/api/admin/leads/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult(data.error || "Scan failed.");
        track("admin_leads_scan_failed", { error: data.error });
        return;
      }
      const s = data.stats;
      setResult(
        `Scanned ${s.companiesScanned} companies · ${s.praiseSignalsFound} new praise signals · ${s.newQualifiedLeads} newly qualified · ${s.highIntentLeads} high-intent`
      );
      track("admin_leads_scan_completed", s);
      router.refresh();
    } catch {
      setResult("Scan failed — network error.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button onClick={run} disabled={running} className="gap-2">
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {running ? "Scanning…" : "Run Scan Now"}
      </Button>
      {result && <p className="max-w-xs text-right text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}
