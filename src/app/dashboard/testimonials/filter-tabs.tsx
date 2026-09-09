"use client";

import { TabsWithProgress } from "@/components/tabs-with-progress";
import type { TestimonialStatus } from "@prisma/client";

/**
 * Thin wrapper for /dashboard/testimonials. This IS a client
 * component, so it can safely build hrefs internally using the
 * server-passed searchQuery string (all serializable primitives).
 * The generic TabsWithProgress expects pre-built hrefs on each
 * tab item; we compute them here.
 */
export type FilterTab = "ALL" | TestimonialStatus;

interface Tab {
  label: string;
  value: FilterTab;
  count: number;
}

interface Props {
  tabs: Tab[];
  activeFilter: FilterTab;
  searchQuery: string;
}

function buildHref(value: FilterTab, q: string): string {
  const params = new URLSearchParams();
  if (value !== "ALL") params.set("filter", value.toLowerCase());
  if (q) params.set("q", q);
  const qs = params.toString();
  return `/dashboard/testimonials${qs ? `?${qs}` : ""}`;
}

export function FilterTabs({ tabs, activeFilter, searchQuery }: Props) {
  const enriched = tabs.map((t) => ({ ...t, href: buildHref(t.value, searchQuery) }));
  return <TabsWithProgress tabs={enriched} activeValue={activeFilter} />;
}
