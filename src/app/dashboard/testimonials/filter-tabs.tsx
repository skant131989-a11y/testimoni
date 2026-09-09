"use client";

import { TabsWithProgress } from "@/components/tabs-with-progress";
import type { TestimonialStatus } from "@prisma/client";

/**
 * Thin wrapper around the shared TabsWithProgress that knows the
 * URL shape for /dashboard/testimonials?filter=…&q=…. The generic
 * component doesn't hardcode any URL logic so the same primitive
 * powers Inbox + Testimonials without divergent behavior.
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
  return (
    <TabsWithProgress
      tabs={tabs}
      activeValue={activeFilter}
      buildHref={(value) => buildHref(value, searchQuery)}
    />
  );
}
