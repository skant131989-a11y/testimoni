"use client";

import Link from "next/link";
import { Gauge } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * "7 of 10 scans left this month" under the Find my praise card. For
 * Free accounts it also says what Pro adds to scanning.
 */
export function ScanAllowance({
  used,
  limit,
  isPro,
}: {
  used: number;
  limit: number;
  isPro: boolean;
}) {
  const left = Math.max(limit - used, 0);

  return (
    <p className="-mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-muted-foreground">
      <Gauge className="h-3.5 w-3.5" />
      <span>
        <span className="font-semibold text-foreground">
          {left} of {limit}
        </span>{" "}
        {isPro ? "deep scans" : "scans"} left this month
      </span>
      {!isPro && (
        <>
          <span aria-hidden>·</span>
          <Link
            href="/pricing?src=dashboard_scan_allowance"
            onClick={() => track("upgrade_nudge_clicked", { surface: "dashboard_scan_allowance" })}
            className="font-medium text-primary hover:underline"
          >
            Pro: 30 deeper scans and a weekly re-scan emailed to you
          </Link>
        </>
      )}
    </p>
  );
}
