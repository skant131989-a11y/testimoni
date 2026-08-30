import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { TrackedLink } from "@/components/tracked-link";

interface PublicNavProps {
  right?: React.ReactNode;
}

/**
 * Public marketing-page header. Server component — reads Supabase auth once
 * and renders "Dashboard" if signed-in, "Log in / Get Started Free" if not.
 * Falls back gracefully if Supabase env vars are missing.
 */
export async function PublicNav({ right }: PublicNavProps) {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    isLoggedIn = false;
  }

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

        {/* Primary nav — hidden on mobile to keep the header uncluttered */}
        <nav className="hidden items-center gap-6 md:flex">
          <TrackedLink cta="nav_demo" surface="public_nav" href="/demo" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Demo
          </TrackedLink>
          <TrackedLink cta="nav_features" surface="public_nav" href="/features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </TrackedLink>
          <TrackedLink cta="nav_pricing" surface="public_nav" href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </TrackedLink>
          <TrackedLink cta="nav_blog" surface="public_nav" href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Blog
          </TrackedLink>
        </nav>

        <nav className="flex items-center gap-3">
          {right}
          {isLoggedIn ? (
            <Button size="sm" asChild>
              <TrackedLink cta="nav_dashboard" surface="public_nav" href="/dashboard">Dashboard</TrackedLink>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <TrackedLink cta="nav_login" surface="public_nav" href="/login">Log in</TrackedLink>
              </Button>
              <Button size="sm" asChild>
                <TrackedLink cta="nav_signup" surface="public_nav" href="/signup">Get Started Free</TrackedLink>
              </Button>
            </>
          )}
        </nav>
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
