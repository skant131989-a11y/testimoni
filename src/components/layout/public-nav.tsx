import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

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
        <nav className="flex items-center gap-3">
          {right}
          {isLoggedIn ? (
            <Button size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Get Started Free</Link>
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
