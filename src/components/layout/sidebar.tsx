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
  ExternalLink,
  Copy,
  Check,
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
            shareable asset. Cheap to show, big value if users click
            through and share. Hidden when there's no widget yet
            (fresh account still provisioning) so we don't ship a
            broken link. */}
        {wallUrl && (
          <div className={cn("border-b p-3", collapsed && "px-2")}>
            {collapsed ? (
              <a
                href={wallUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Your Wall of Love"
                className="flex items-center justify-center rounded-md p-2 text-primary hover:bg-primary/10"
                onClick={() =>
                  track("wall_view_clicked", { surface: "sidebar", via: "icon" })
                }
              >
                <Sparkles className="h-5 w-5" />
              </a>
            ) : (
              <div className="rounded-md bg-primary/5 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Your Wall of Love
                  </p>
                </div>
                <a
                  href={wallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={wallUrl}
                  className="mt-1 block truncate text-xs text-foreground hover:text-primary hover:underline"
                  onClick={() =>
                    track("wall_view_clicked", { surface: "sidebar", via: "url_text" })
                  }
                >
                  {wallUrl.replace(/^https?:\/\//, "")}
                </a>
                <div className="mt-1.5 flex gap-1">
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-6 flex-1 px-1.5 text-[10px]"
                  >
                    <a
                      href={wallUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        track("wall_view_clicked", { surface: "sidebar", via: "button" })
                      }
                    >
                      <ExternalLink className="mr-0.5 h-3 w-3" /> View
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 flex-1 px-1.5 text-[10px]"
                    onClick={copyWallUrl}
                  >
                    {wallCopied ? (
                      <>
                        <Check className="mr-0.5 h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-0.5 h-3 w-3" /> Copy
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
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
