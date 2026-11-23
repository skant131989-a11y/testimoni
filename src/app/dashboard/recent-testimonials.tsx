import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { AvatarImage } from "@/components/avatar-image";

/**
 * "Latest on your wall": the newest testimonials as quote cards, quote first.
 * Its own async server component so it streams in behind a <Suspense> and the
 * stats above never wait for this query.
 */
export async function RecentTestimonialsCard({
  workspaceId,
  formShareHref,
}: {
  workspaceId: string;
  formShareHref: string | null;
}) {
  const recentTestimonials = await prisma.testimonial.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Latest on your wall</h3>
        {recentTestimonials.length > 0 && (
          <Link href="/dashboard/testimonials" className="text-sm font-medium text-primary hover:underline">
            See all &rarr;
          </Link>
        )}
      </div>

      {recentTestimonials.length === 0 ? (
        <div className="rounded-2xl border bg-card p-4">
          <DashboardEmptyState
            formUrl={
              formShareHref
                ? `${process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io"}${formShareHref}`
                : null
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recentTestimonials.map((testimonial: (typeof recentTestimonials)[number]) => (
            <div key={testimonial.id} className="flex flex-col rounded-2xl border border-violet-200/70 bg-card p-4">
              {testimonial.rating ? (
                <div className="flex gap-0.5 text-sm text-amber-500" aria-label={`${testimonial.rating} stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < testimonial.rating! ? "" : "text-muted-foreground/30"}>
                      ★
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <AvatarImage src={testimonial.customerAvatar} name={testimonial.customerName} size={28} />
                  <span className="truncate text-sm font-medium">{testimonial.customerName}</span>
                </div>
                <span
                  className={
                    testimonial.status === "APPROVED"
                      ? "shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800"
                      : testimonial.status === "PENDING"
                        ? "shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                        : "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  }
                >
                  {testimonial.status === "APPROVED" ? "on wall" : testimonial.status.toLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Placeholder while the query is in flight; same shape as the real cards. */
export function RecentTestimonialsSkeleton() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Latest on your wall</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-violet-200/70 bg-card p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-4 h-6 w-32 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
