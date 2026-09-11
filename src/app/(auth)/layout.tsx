import Link from "next/link";
import Image from "next/image";
import { AuthHero } from "@/components/auth-hero";

/**
 * Auth layout — two-column split.
 *
 *   Left  (hero side)  — violet/purple gradient with brand storytelling
 *                        and 3 real founder testimonials floating in.
 *                        Route-aware headline (signup vs login vs
 *                        forgot/reset). Collapses to a compact banner
 *                        on mobile so the form stays above-the-fold.
 *
 *   Right (form side)  — the actual signup/login/reset card. Clean
 *                        white surface, max-w-md, breathing room.
 *
 * The auth flow is the last place a first-time visitor can bounce
 * before becoming a user. Dogfooding real testimonials at this
 * step is the highest-signal social proof we can place. Also
 * looks great when someone screenshots the login page and shares
 * it — a common indie-founder ritual.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left — hero (order-1 on mobile so it renders above the form,
          but as a shorter banner) */}
      <div className="relative order-1 flex flex-col overflow-hidden bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-50/40 md:order-none md:min-h-screen md:w-1/2 md:flex-1">
        {/* Ambient blobs — same treatment as home hero */}
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative flex flex-1 flex-col p-6 md:p-10 lg:p-16">
          {/* Brand mark — links back home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-800 hover:text-violet-700"
          >
            <Image
              src="/icon.png"
              alt="Testimoni"
              width={28}
              height={28}
              className="rounded-full"
              priority
            />
            <span className="text-lg font-bold">Testimoni</span>
          </Link>

          <div className="flex flex-1 items-center justify-center py-8 md:py-16">
            <AuthHero />
          </div>

          {/* Bottom row — small footer with a live-wall link */}
          <div className="hidden md:flex md:items-center md:justify-between md:text-xs md:text-muted-foreground">
            <span>&copy; 2026 Testimoni</span>
            <Link
              href="/w/demo"
              className="underline-offset-4 hover:text-violet-700 hover:underline"
            >
              See a live Wall of Love →
            </Link>
          </div>
        </div>
      </div>

      {/* Right — form column */}
      <div className="order-2 flex flex-1 items-center justify-center bg-white px-4 py-10 md:min-h-screen md:w-1/2 md:py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
