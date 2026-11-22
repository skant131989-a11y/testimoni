import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getShareCard } from "@/lib/share-card";

/**
 * The page a reviewer's share links point to. It shows their review as a
 * card, invites the next person to leave theirs, and offers a free wall to
 * anyone who runs a business. The preview image used by X, LinkedIn and chat
 * apps is opengraph-image.tsx next to this file.
 */
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getShareCard(id);
  if (!card) return { title: "Review", robots: { index: false, follow: false } };
  const title = `${card.name} reviewed ${card.workspaceName}`;
  const description = card.quote ? `\u201C${card.quote.slice(0, 160)}\u201D` : `${card.rating ?? 5} out of 5 stars`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const card = await getShareCard(id);
  if (!card) notFound();
  const leaveYours = card.formSlug ? `/collect/${card.workspaceSlug}/${card.formSlug}` : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-3xl border border-violet-200 bg-white p-7 text-left shadow-xl shadow-violet-500/10">
          {card.rating ? (
            <div className="flex gap-0.5 text-amber-400" aria-label={`${card.rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-5 w-5 ${s <= (card.rating ?? 0) ? "fill-current" : "text-gray-200"}`} />
              ))}
            </div>
          ) : null}
          {card.quote && <p className="mt-3 text-lg leading-relaxed">&ldquo;{card.quote}&rdquo;</p>}
          <p className="mt-4 text-sm font-semibold">
            {card.name} <span className="font-normal text-muted-foreground">on {card.workspaceName}</span>
          </p>
        </div>

        {leaveYours && (
          <Link
            href={leaveYours}
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25"
          >
            Leave your own review of {card.workspaceName}
          </Link>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          Run a business?{" "}
          <Link href="/signup?src=share_page" className="font-semibold text-primary underline-offset-4 hover:underline">
            Collect reviews like this, free
          </Link>
        </p>
      </div>
    </main>
  );
}
