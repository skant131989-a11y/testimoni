import Link from "next/link";
import Image from "next/image";
import { TrackedLink } from "@/components/tracked-link";
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
 */
export function PublicNav({ right }: PublicNavProps) {
  return (
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
            cta="nav_demo"
            surface="public_nav"
            href="/demo"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Live Demo
          </TrackedLink>
          <TrackedLink
            cta="nav_features"
            surface="public_nav"
            href="/features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </TrackedLink>
          <TrackedLink
            cta="nav_pricing"
            surface="public_nav"
            href="/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </TrackedLink>
          <TrackedLink
            cta="nav_blog"
            surface="public_nav"
            href="/blog"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Blog
          </TrackedLink>
          {right}
          <PublicNavAuth />
        </nav>

        <PublicNavAuthMobile />
      </div>
    </header>
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
