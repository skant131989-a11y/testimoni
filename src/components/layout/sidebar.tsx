"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
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
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Gauge,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PlanType } from "@/lib/constants";
import { QuoteOpen } from "@/components/icons/quote-open";
import { track } from "@/lib/analytics";

const navItems: {
  href: string;
  label: string;
  icon: React.ElementType;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/testimonials", label: "Testimonials", icon: QuoteOpen },
  { href: "/dashboard/widgets", label: "Widgets", icon: Code2 },
  { href: "/dashboard/collect", label: "Collect", icon: Send },
  { href: "/dashboard/import", label: "Import", icon: Import },
  { href: "/dashboard/sources", label: "Review sources", icon: RefreshCw },
  { href: "/dashboard/wall-score", label: "Wall Score", icon: Gauge },
  { href: "/dashboard/tweet-drafts", label: "Tweet drafts", icon: Send },
  { href: "/dashboard/ask-my-wall", label: "Ask My Wall", icon: MessageSquare },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  workspaceName: string;
  plan: PlanType;
  /** Wall URL for the workspace's default widget. If null (no widget
   *  yet — should never happen after signup but defensive), the wall
   *  link is hidden. Absolute URL preferred so Copy gets the full
   *  shareable link. */
  wallUrl: string | null;
}

export function Sidebar({ workspaceName, plan, wallUrl }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [wallCopied, setWallCopied] = useState(false);

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
      {/* Mobile overlay */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300 lg:relative",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon.png"
                alt="Testimoni logo"
                width={32}
                height={32}
                className="rounded-lg"
                priority
              />
              <span className="text-lg font-semibold">Testimoni</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="mx-auto flex items-center justify-center">
              <Image
                src="/icon.png"
                alt="Testimoni logo"
                width={32}
                height={32}
                className="rounded-lg"
                priority
              />
            </Link>
          )}
        </div>

        {/* Workspace name */}
        {!collapsed && (
          <div className="border-b px-4 py-3">
            <p className="truncate text-sm font-medium text-muted-foreground">
              {workspaceName}
            </p>
          </div>
        )}

        {/* Your Wall of Love — always-visible link to the primary
            shareable asset. Prominently styled (gradient, bigger
            heading + heart emoji) because sharing the wall is the
            #1 outcome we want users to remember. Cheap to show,
            outsized value when users click through and share. */}
        {wallUrl && (
          <div className={cn("border-b p-3", collapsed && "px-2")}>
            {collapsed ? (
              <a
                href={wallUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Your Wall of Love"
                className="flex items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-pink-500/15 p-2 text-primary hover:from-primary/30 hover:to-pink-500/25"
                onClick={() =>
                  track("wall_view_clicked", { surface: "sidebar", via: "icon" })
                }
              >
                <Heart className="h-5 w-5 fill-current" />
              </a>
            ) : (
              <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-pink-500/[0.06] to-transparent p-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 shrink-0 fill-primary text-primary" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Your Wall of Love
                  </p>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Share this anywhere — bio, email, DM.
                </p>
                <a
                  href={wallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={wallUrl}
                  className="mt-2 block truncate rounded border border-primary/15 bg-background/70 px-2 py-1 font-mono text-[11px] text-foreground hover:border-primary/40 hover:text-primary"
                  onClick={() =>
                    track("wall_view_clicked", { surface: "sidebar", via: "url_text" })
                  }
                >
                  {wallUrl.replace(/^https?:\/\//, "")}
                </a>
                <div className="mt-2 flex gap-1.5">
                  <Button
                    asChild
                    size="sm"
                    className="h-7 flex-1 px-2 text-[11px]"
                  >
                    <a
                      href={wallUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        track("wall_view_clicked", { surface: "sidebar", via: "button" })
                      }
                    >
                      <ExternalLink className="mr-1 h-3 w-3" /> View
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 flex-1 px-2 text-[11px]"
                    onClick={copyWallUrl}
                  >
                    {wallCopied ? (
                      <>
                        <Check className="mr-1 h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3 w-3" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {/* Small "NEW" pill — moved from Import to
                    Review Sources since that's the newest thing
                    users should discover. Rendered in the collapsed
                    sidebar too as a bare purple dot so the signal
                    survives at 40px width. */}
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
            );
          })}
        </nav>

        {/* Upgrade banner for free plan */}
        {plan === "FREE" && !collapsed && (
          <div className="m-3 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Upgrade to Pro</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Unlock unlimited testimonials, widgets, and more.
            </p>
            <Button size="sm" className="mt-3 w-full" asChild>
              <Link href="/dashboard/settings#billing">Upgrade</Link>
            </Button>
          </div>
        )}

        {/* Collapse toggle */}
        <div className="border-t p-2 space-y-1">
          <Link
            href="/contact"
            target="_blank"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Send feedback" : undefined}
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Send feedback</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
