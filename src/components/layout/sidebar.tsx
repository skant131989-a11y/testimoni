"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Mail,
  Code2,
  Inbox,
  Send,
  MessageCircle,
  Import,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  Copy,
  Check,
  RefreshCw,
  Gauge,
  MessageSquare,
  Target,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UpgradeProButton } from "@/components/upgrade-pro-button";
import { PLAN_LIMITS, type PlanType } from "@/lib/constants";
import { QuoteOpen } from "@/components/icons/quote-open";
import { useMobileNav } from "@/components/layout/mobile-nav";
import { track } from "@/lib/analytics";

const navItems: {
  href: string;
  label: string;
  icon: React.ElementType;
  /** Small tag shown to Free accounts: what the free plan includes. */
  freeTag?: string;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/testimonials", label: "Testimonials", icon: QuoteOpen },
  { href: "/dashboard/widgets", label: "Widgets", icon: Code2 },
  { href: "/dashboard/collect", label: "Collect", icon: Send },
  { href: "/dashboard/requests", label: "Requests", icon: Mail, freeTag: "3/mo" },
  { href: "/dashboard/import", label: "Import", icon: Import },
  { href: "/dashboard/sources", label: "Review sources", icon: RefreshCw },
  { href: "/dashboard/wall-score", label: "Wall Score", icon: Gauge, freeTag: "1 free" },
  { href: "/dashboard/proof-placement", label: "Proof placement", icon: Target, freeTag: "1 free" },
  { href: "/dashboard/tweet-drafts", label: "Tweet drafts", icon: Send, freeTag: "5/mo" },
  { href: "/dashboard/ask-my-wall", label: "Ask My Wall", icon: MessageSquare, freeTag: "30/mo" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/** A thin divider after these items splits the list into groups (your wall,
 *  getting proof in, using it, then the account links) without taking the
 *  height of section headings. */
const DIVIDER_AFTER = new Set([
  "/dashboard/widgets",
  "/dashboard/sources",
  "/dashboard/ask-my-wall",
]);

interface SidebarProps {
  workspaceName: string;
  plan: PlanType;
  /** Wall URL for the workspace's default widget. If null (no widget
   *  yet — should never happen after signup but defensive), the wall
   *  link is hidden. Absolute URL preferred so Copy gets the full
   *  shareable link. */
  wallUrl: string | null;
  /** Testimonials in the workspace (Free accounts only). */
  testimonialCount?: number;
}

export function Sidebar({ workspaceName, plan, wallUrl, testimonialCount }: SidebarProps) {
  const pathname = usePathname();
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileNav();
  // "Collapsed to icons" is a desktop-only preference; the phone drawer
  // always shows the full labels.
  const [collapsedPref, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const collapsed = collapsedPref && isDesktop;
  const [wallCopied, setWallCopied] = useState(false);
  const [count, setCount] = useState<number | undefined>(testimonialCount);

  // Testimonials waiting for approval, shown as a badge on Inbox. Refreshed
  // on every navigation and whenever the tab comes back into view, so a
  // submission that arrived while you were elsewhere shows up.
  const [pendingInbox, setPendingInbox] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/inbox/count", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && d && typeof d.pending === "number") setPendingInbox(d.pending);
        })
        .catch(() => {});
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  // The sidebar stays mounted while pages change, so refresh the count
  // on each navigation (Free accounts only).
  useEffect(() => {
    if (plan !== "FREE") return;
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.usage?.testimonials === "number") setCount(d.usage.testimonials);
      })
      .catch(() => {});
  }, [pathname, plan]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Close the drawer after navigating, and on Escape.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  async function copyWallUrl() {
    if (!wallUrl) return;
    try {
      await navigator.clipboard.writeText(wallUrl);
      setWallCopied(true);
      track("wall_url_copied", { surface: "sidebar" });
      setTimeout(() => setWallCopied(false), 2000);
    } catch {}
  }

  return (
    <>
      {/* Phones and tablets: dim the page behind the open drawer; tap to close. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          // Below lg: an off-canvas drawer that slides in from the left.
          // From lg up: the normal always-visible sidebar.
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r bg-background transition-transform duration-300 lg:relative lg:max-w-none lg:translate-x-0 lg:transition-all",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        {/* One header row: logo and workspace name. */}
        <div className="flex h-14 shrink-0 items-center gap-1 border-b px-3">
          <Link
            href="/"
            className={cn("flex min-w-0 items-center gap-2", collapsed ? "mx-auto" : "flex-1")}
            title={collapsed ? workspaceName : undefined}
          >
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={32}
              height={32}
              className="shrink-0 rounded-lg"
              priority
            />
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <span className="block text-sm font-semibold">Testimoni</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {workspaceName}
                </span>
              </div>
            )}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable middle. The aside is a fixed-height column inside an
            overflow-hidden layout, so on shorter screens everything below
            the fold was clipped and unreachable. The logo above and the
            footer below stay pinned; this region scrolls between them. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Your Wall of Love: its own row at the top of the list (View + a copy
            button), a single heart when the sidebar is collapsed. */}
        {wallUrl && (
          <div className="px-2 pt-2">
            {collapsed ? (
              <a
                href={wallUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Your Wall of Love"
                className="flex items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-pink-500/15 p-2 text-primary hover:from-primary/30 hover:to-pink-500/25"
                onClick={() => track("wall_view_clicked", { surface: "sidebar", via: "icon" })}
              >
                <Heart className="h-5 w-5 fill-current" />
              </a>
            ) : (
              <div className="flex items-center rounded-md bg-primary/5 transition-colors hover:bg-primary/10">
                <a
                  href={wallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open your Wall of Love (${wallUrl.replace(/^https?:\/\//, "")})`}
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-1 text-sm font-semibold text-primary"
                  onClick={() => track("wall_view_clicked", { surface: "sidebar", via: "url_text" })}
                >
                  <Heart className="h-[18px] w-[18px] shrink-0 fill-current" />
                  <span className="truncate">Your Wall of Love</span>
                </a>
                <Button
                  size="icon"
                  variant="ghost"
                  className="mr-0.5 h-7 w-7 shrink-0 text-primary hover:bg-primary/10"
                  onClick={copyWallUrl}
                  title="Copy your wall link to share"
                  aria-label="Copy wall link"
                >
                  {wallCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-0.5 px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Fragment key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!collapsed && plan === "FREE" && item.freeTag && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      item.freeTag === "Pro"
                        ? "bg-violet-600 text-white"
                        : "bg-violet-100 text-violet-700"
                    )}
                  >
                    {item.freeTag}
                  </span>
                )}
                {/* Small "NEW" pill — moved from Import to
                    Review Sources since that's the newest thing
                    users should discover. Rendered in the collapsed
                    sidebar too as a bare purple dot so the signal
                    survives at 40px width. */}
                {item.href === "/dashboard/inbox" && pendingInbox > 0 && (
                  <>
                    {!collapsed && (
                      <span
                        className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                        aria-label={`${pendingInbox} waiting for approval`}
                      >
                        {pendingInbox > 99 ? "99+" : pendingInbox}
                      </span>
                    )}
                    {collapsed && (
                      <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
                    )}
                  </>
                )}
                {item.href === "/dashboard/sources" && (
                  <>
                    {!collapsed && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                        New
                      </span>
                    )}
                    {collapsed && (
                      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </>
                )}
              </Link>
              {DIVIDER_AFTER.has(item.href) && <div className="mx-2 my-1 border-t" />}
              </Fragment>
            );
          })}
        </nav>

        </div>

        {/* Pinned footer: feedback and the collapse toggle share one row. */}
        <div className="shrink-0 border-t">
          {/* Sticky upgrade strip: always visible, like Send feedback. */}
          {plan === "FREE" && !collapsed && (() => {
            const used = count ?? 0;
            const max = PLAN_LIMITS.FREE.maxTestimonials;
            const pct = Math.min(100, Math.round((used / max) * 100));
            const near = used >= max - 2;
            return (
              <div className="border-b bg-gradient-to-br from-primary/5 to-primary/10 px-3 py-2">
                {count !== undefined && (
                  <div className="mb-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className={near ? "font-medium text-foreground" : undefined}>
                        {used >= max ? "Free limit reached" : `${used} of ${max} testimonials used`}
                      </span>
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-primary/15">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
                <UpgradeProButton
                  surface="sidebar_upgrade_banner"
                  size="sm"
                  className="w-full"
                  label="Upgrade to Pro, $19/mo"
                />
              </div>
            );
          })()}
          <div className={cn("flex items-center gap-1 p-2", collapsed && "flex-col")}>
          <Link
            href="/contact"
            target="_blank"
            className={cn(
              "flex flex-1 items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              collapsed && "w-full flex-none justify-center px-2"
            )}
            title={collapsed ? "Send feedback" : undefined}
          >
            <MessageCircle className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Send feedback</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsedPref)}
            className="hidden h-8 w-8 shrink-0 lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        </div>
      </aside>
    </>
  );
}
