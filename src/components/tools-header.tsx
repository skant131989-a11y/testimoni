"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/tracked-link";

/**
 * Shared header for /tools pages.
 *
 * Cold visitors landing on a specific tool from Google need context
 * — what Testimoni is, what other tools exist, how to reach the
 * demo/pricing. A Logo + single "Start free" button was too thin.
 *
 * Ships the same nav pattern as the home page (Live Demo · Free
 * Tools · Pricing) so users learn navigation once. Free Tools is
 * always active on /tools/* — highlights subtly.
 *
 * Optional `backToTools` prop adds a "← All tools" breadcrumb row
 * on individual tool pages (not on the /tools index itself).
 */
export function ToolsHeader({ backToTools = false }: { backToTools?: boolean }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="Testimoni logo"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="text-xl font-bold">Testimoni</span>
        </Link>

        {/* Desktop nav — full four-link set + primary CTA */}
        <nav className="hidden items-center gap-6 md:flex">
          <TrackedLink
            cta="tools_nav_demo"
            surface="tools_nav"
            href="/demo"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Live Demo
          </TrackedLink>
          <TrackedLink
            cta="tools_nav_tools"
            surface="tools_nav"
            href="/tools"
            className="text-sm font-medium text-primary hover:underline"
          >
            Free Tools
          </TrackedLink>
          <TrackedLink
            cta="tools_nav_pricing"
            surface="tools_nav"
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Pricing
          </TrackedLink>
          <TrackedLink cta="tools_nav_login" surface="tools_nav" href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </TrackedLink>
          <TrackedLink cta="tools_nav_signup" surface="tools_nav" href="/signup">
            <Button size="sm">Get Started Free</Button>
          </TrackedLink>
        </nav>

        {/* Mobile — one link + primary CTA. Kept tight. */}
        <div className="flex items-center gap-3 md:hidden">
          <TrackedLink
            cta="tools_nav_mobile_home"
            surface="tools_nav"
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Home
          </TrackedLink>
          <TrackedLink
            cta="tools_nav_mobile_signup"
            surface="tools_nav"
            href="/signup"
          >
            <Button size="sm">Start free</Button>
          </TrackedLink>
        </div>
      </div>

      {/* Optional breadcrumb — a small "← All tools" row on individual
          tool pages so users can jump between tools without hunting
          for the /tools index. */}
      {backToTools && (
        <div className="border-t bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <TrackedLink
              cta="tools_breadcrumb_index"
              surface="tools_nav"
              href="/tools"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              All tools
            </TrackedLink>
          </div>
        </div>
      )}
    </header>
  );
}
