import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyReviewToken } from "@/lib/review-token";
import { ReviewActions } from "./review-actions";

/**
 * The page the email's "Approve" button opens. It shows the testimonial and
 * two buttons; nothing changes until a button is pressed, so mail scanners
 * that open every link cannot approve anything by accident.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review a testimonial", robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const verified = verifyReviewToken(token);
  if (!verified) {
    return (
      <Shell>
        <div className="rounded-2xl border bg-white p-7 text-center shadow-lg">
          <h1 className="text-xl font-bold">This link has expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review links last 14 days. Your inbox has everything that is still waiting.</p>
          <Link href="/dashboard/inbox" className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Open my inbox
          </Link>
        </div>
      </Shell>
    );
  }

  const sub = await prisma.submission.findUnique({
    where: { id: verified.submissionId },
    select: {
      content: true,
      rating: true,
      customerName: true,
      status: true,
      form: { select: { workspace: { select: { name: true } } } },
    },
  });
  if (!sub) {
    return (
      <Shell>
        <div className="rounded-2xl border bg-white p-7 text-center shadow-lg">
          <h1 className="text-xl font-bold">We couldn&apos;t find that one</h1>
          <Link href="/dashboard/inbox" className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Open my inbox
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="rounded-3xl border border-violet-200 bg-white p-7 shadow-xl shadow-violet-500/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          New testimonial for {sub.form.workspace.name}
        </p>
        {sub.rating ? (
          <div className="mt-3 flex gap-0.5 text-amber-400" aria-label={`${sub.rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-5 w-5 ${s <= (sub.rating ?? 0) ? "fill-current" : "text-gray-200"}`} />
            ))}
          </div>
        ) : null}
        {sub.content ? (
          <p className="mt-3 text-lg italic leading-relaxed">&ldquo;{sub.content}&rdquo;</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">(A rating only, no written words.)</p>
        )}
        <p className="mt-3 text-sm font-semibold">{sub.customerName}</p>

        <ReviewActions token={token} status={sub.status} />
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Want more detail first?{" "}
        <Link href="/dashboard/inbox" className="font-semibold text-primary underline-offset-4 hover:underline">
          Open your inbox
        </Link>
      </p>
    </Shell>
  );
}
