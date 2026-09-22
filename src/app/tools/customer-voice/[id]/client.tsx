"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { ScanResultView, type ApiScanResult } from "../result-view";

function storageKey(id: string): string {
  return `scan_unlock_${id}`;
}

export function ScanReportClient({ id }: { id: string }) {
  const [result, setResult] = useState<ApiScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("t") || window.localStorage.getItem(storageKey(id)) || "";
      try {
        const res = await fetch(`/api/scans/${id}${token ? `?t=${encodeURIComponent(token)}` : ""}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Couldn't load this report.");
          return;
        }
        setResult(data);
        track("scan_result_viewed", { scanId: id, locked: data.locked });
      } catch {
        if (!cancelled) setError("Network hiccup. Refresh to try again.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleUnlocked(full: ApiScanResult) {
    setResult(full);
    if (full.unlockToken) {
      try {
        window.localStorage.setItem(storageKey(id), full.unlockToken);
        window.history.replaceState(null, "", `/tools/customer-voice/${id}?t=${full.unlockToken}`);
      } catch {}
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Link href="/tools/customer-voice" className="mt-4 inline-block text-sm text-primary underline">
          Scan another URL
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
      <ScanResultView result={result} onUnlocked={handleUnlocked} />
      {/* The zero-mentions empty state inside ScanResultView already
          has its own prominent "Scan another URL" button — skip this
          one there so the page doesn't show two. */}
      {result.totalMentions > 0 && (
        <div className="mt-10 text-center">
          <Link href="/tools/customer-voice">
            <Button variant="outline" size="lg" className="gap-2">
              <Search className="h-4 w-4" /> Scan another URL
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
