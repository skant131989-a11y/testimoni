import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignupToken } from "@/lib/signup-link-token";
import { OpenButton } from "./open-button";

/**
 * The page the reminder email's button opens. It shows one button; nothing
 * happens until it is pressed, so mail scanners that open every link cannot
 * sign anyone in.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Open your dashboard", robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-7 text-center shadow-lg">{children}</div>
    </main>
  );
}

export default async function OpenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const verified = verifySignupToken(token);
  if (!verified) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">This link has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">Links last 7 days. You can get a new code in a few seconds.</p>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Log in
        </Link>
      </Shell>
    );
  }

  let email = "";
  let alreadyIn = false;
  try {
    const { data } = await createAdminClient().auth.admin.getUserById(verified.authUserId);
    email = data?.user?.email ?? "";
    alreadyIn = Boolean(data?.user?.last_sign_in_at);
  } catch {
    // Falls through to the generic message below.
  }

  if (!email || alreadyIn) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">{alreadyIn ? "You are already in" : "We couldn't find that account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Log in with a code sent to your email.</p>
        <Link
          href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
          className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Log in
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Your Wall of Love is ready.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        One tap and you are in. Free for 15 testimonials, no credit card.
      </p>
      <OpenButton token={token} email={email} />
    </Shell>
  );
}
