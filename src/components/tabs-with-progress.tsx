"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Generic filter-tab strip with useTransition + a top progress bar.
 *
 * Any dashboard page with a Link-based "?filter=…" tab strip can
 * drop this in and get:
 *   - Instant click feedback (target tab tints purple while loading)
 *   - Thin gradient progress bar fixed to top-of-viewport
 *   - "Loading…" label on the far right of the tabs
 *   - Fallback: browser back/forward still uses hard nav → loading.tsx
 *
 * Usage:
 *   <TabsWithProgress
 *     tabs={[{ label: "New", value: "NEW", count: 12 }, ...]}
 *     activeValue="NEW"
 *     basePath="/dashboard/inbox"
 *     buildHref={(value) => `/dashboard/inbox?filter=${value.toLowerCase()}`}
 *   />
 */
interface TabItem<V extends string> {
  label: string;
  value: V;
  count: number;
}

interface Props<V extends string> {
  tabs: TabItem<V>[];
  activeValue: V;
  buildHref: (value: V) => string;
}

export function TabsWithProgress<V extends string>({
  tabs,
  activeValue,
  buildHref,
}: Props<V>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingValue, setPendingValue] = useState<V | null>(null);

  useEffect(() => {
    if (!isPending) setPendingValue(null);
  }, [isPending, activeValue]);

  function selectTab(value: V) {
    if (value === activeValue) return;
    setPendingValue(value);
    startTransition(() => {
      router.push(buildHref(value));
    });
  }

  return (
    <>
      <TopProgress active={isPending} />

      <div className="relative flex items-center gap-1 border-b">
        {tabs.map((tab) => {
          const isActive = activeValue === tab.value;
          const isTarget = pendingValue === tab.value;
          return (
            <Link
              key={tab.value}
              href={buildHref(tab.value)}
              onClick={(e) => {
                e.preventDefault();
                selectTab(tab.value);
              }}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : isTarget
                    ? "border-primary/40 text-primary/70"
                    : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
        {isPending && (
          <div className="ml-auto flex items-center gap-2 pr-2 text-xs text-muted-foreground">
            Loading…
          </div>
        )}
      </div>
    </>
  );
}

function TopProgress({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      setWidth(10);
      const t1 = setTimeout(() => setWidth(50), 80);
      const t2 = setTimeout(() => setWidth(80), 400);
      const t3 = setTimeout(() => setWidth(92), 1200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    setWidth(100);
    const t = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 220);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div
      aria-hidden
      className={cn(
        "fixed left-0 right-0 top-0 z-50 h-0.5 bg-transparent transition-opacity",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-pink-500 to-primary transition-all duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
