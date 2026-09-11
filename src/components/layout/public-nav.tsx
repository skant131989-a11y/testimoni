import Link from "next/link";
import Image from "next/image";
import { TrackedLink } from "@/components/tracked-link";
import { LaunchBar } from "@/components/launch-bar";
import {
  PublicNavAuth,
  PublicNavAuthMobile,
} from "./public-nav-auth";

interface PublicNavProps {
  right?: React.ReactNode;
}

/**
 * Public marketing-page header. Static server component — no auth
 * check, no cookies read, no dynamic APIs. This lets every marketing
 * page (features, pricing, vs/*, about, blog, etc.) be
 * pre-rendered at build time and cached at the CDN edge.
 *
 * The auth-aware section (Log in / Get Started vs Dashboard) is
 * split into PublicNavAuth (client) which hydrates after mount.
 * See public-nav-auth.tsx for the trade-offs.
 *
 * The <LaunchBar> at the top piggy-backs on this component so
 * every marketing surface (features, pricing, tools/*, vs/*,
 * for/*, docs, blog, about, etc.) gets the same launch-week
 * interrupt without a per-page edit. Same dismissal id as the
 * home-page bar, so a visitor who dismissed on home doesn't get
 * hit again on /pricing. Home has its own header (not this
 * component) — the home bar lives there directly.
 */
export function PublicNav({ right }: PublicNavProps) {
  return (
    <>
      <LaunchBar
        id="ask-my-wall-2026-09"
        href="/#new-ai-features"
        message="Ask My Wall is live — an AI chatbot that only quotes real customers."
        cta="See it"
      />
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Testimoni logo"
              width={28}
              height={28}
              className="rounded-full"
              priority
            />
            <span className="text-xl font-bold">Testimoni</span>
          </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <TrackedLink
            cta="nav_find_my_proof"
            surface="public_nav"
            href="/tools/find-my-proof"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Find my proof
          </TrackedLink>
          <TrackedLink
            cta="nav_tools"
            surface="public_nav"
            href="/tools"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Free tools
          </TrackedLink>
          <TrackedLink
            cta="nav_sample_wall"
            surface="public_nav"
            href="/w/demo"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sample wall
          </TrackedLink>
          <TrackedLink
            cta="nav_pricing"
            surface="public_nav"
            href="/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </TrackedLink>
          {right}
          <PublicNavAuth />
        </nav>

        <PublicNavAuthMobile />
      </div>
    </header>
    </>
  );
}

/**
 * Client-safe helper: given a login-status prop, returns the right href
 * for a "Get Started" CTA on public marketing pages.
 */
export function getStartedHref(isLoggedIn: boolean): string {
  return isLoggedIn ? "/dashboard" : "/signup";
}

export function getStartedLabel(isLoggedIn: boolean): string {
  return isLoggedIn ? "Go to Dashboard" : "Get Started Free";
}
