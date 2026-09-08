import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";

/**
 * Recent Testimonials card — extracted from dashboard/page.tsx and
 * turned into its own async server component so it can be streamed
 * behind a <Suspense> boundary. The findMany here is the slowest
 * query on the dashboard (5 rows joined with images/videos), and
 * blocking above-the-fold stats + FormUrlCard on it made the whole
 * dashboard feel sluggish. Now the stats render instantly; this
 * card fills in when its query returns.
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
    take: 5,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Testimonials</CardTitle>
        <CardDescription>
          Your latest testimonials across all sources.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentTestimonials.length === 0 ? (
          <div className="py-2">
            <DashboardEmptyState
              formUrl={
                formShareHref
                  ? `${process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io"}${formShareHref}`
                  : null
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {recentTestimonials.map((testimonial: (typeof recentTestimonials)[number]) => (
              <div
                key={testimonial.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                {testimonial.customerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={testimonial.customerAvatar}
                    alt={testimonial.customerName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {testimonial.customerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {testimonial.customerName}
                    </p>
                    <Badge
                      variant={
                        testimonial.status === "APPROVED"
                          ? "default"
                          : testimonial.status === "PENDING"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {testimonial.status.toLowerCase()}
                    </Badge>
                  </div>
                  {testimonial.rating && (
                    <div className="mt-0.5 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < testimonial.rating!
                              ? "text-yellow-500"
                              : "text-muted-foreground/30"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {testimonial.content}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(testimonial.createdAt).toLocaleDateString()}
                </time>
              </div>
            ))}

            <div className="pt-2 text-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/testimonials">View all testimonials</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton shown while the Recent Testimonials query is in flight.
 * Matches the real card's dimensions so there's no layout shift when
 * the actual content streams in.
 */
export function RecentTestimonialsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Testimonials</CardTitle>
        <CardDescription>
          Your latest testimonials across all sources.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-lg border p-4"
            >
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
