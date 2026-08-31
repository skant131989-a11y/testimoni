import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/letter-avatar";

interface WallPageProps {
  params: Promise<{ widgetId: string }>;
}

async function getWidget(widgetId: string) {
  return prisma.widget.findUnique({
    where: { id: widgetId },
    include: {
      workspace: {
        select: {
          name: true,
          slug: true,
          logoUrl: true,
          subscription: { select: { plan: true } },
        },
      },
      testimonials: {
        orderBy: { position: "asc" },
        include: {
          testimonial: {
            select: {
              id: true,
              content: true,
              rating: true,
              customerName: true,
              customerAvatar: true,
              customerTitle: true,
              customerUrl: true,
            },
          },
        },
        where: {
          testimonial: { status: "APPROVED" },
        },
      },
    },
  });
}

export async function generateMetadata(
  { params }: WallPageProps
): Promise<Metadata> {
  const { widgetId } = await params;
  const widget = await getWidget(widgetId);
  if (!widget || !widget.isActive) {
    return { title: "Wall not found" };
  }
  const title = `${widget.workspace.name} — Wall of Love`;
  const count = widget.testimonials.length;
  const description = count
    ? `Read ${count} customer ${count === 1 ? "testimonial" : "testimonials"} for ${widget.workspace.name}. Powered by Testimoni.`
    : `Wall of Love for ${widget.workspace.name}. Powered by Testimoni.`;
  return {
    title,
    description,
    alternates: { canonical: `/w/${widgetId}` },
    openGraph: { title, description, url: `/w/${widgetId}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HostedWallPage({ params }: WallPageProps) {
  const { widgetId } = await params;
  const widget = await getWidget(widgetId);

  if (!widget || !widget.isActive) {
    notFound();
  }

  const plan = getEffectivePlan(
    widget.workspace.slug,
    widget.workspace.subscription?.plan
  );
  const showWatermark = plan === "FREE";

  const testimonialsRaw = widget.testimonials.map((wt) => wt.testimonial);
  const testimonials = widget.maxItems
    ? testimonialsRaw.slice(0, widget.maxItems)
    : testimonialsRaw;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 via-background to-background">
      {/* Hero */}
      <header className="mx-auto max-w-5xl px-4 pt-16 pb-10 text-center">
        {widget.workspace.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={widget.workspace.logoUrl}
            alt={widget.workspace.name}
            className="mx-auto mb-4 h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {widget.workspace.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Wall of Love
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          What customers are saying about{" "}
          <span className="font-semibold text-foreground">
            {widget.workspace.name}
          </span>
        </p>
      </header>

      {/* Testimonials grid */}
      <main className="mx-auto max-w-6xl px-4 pb-16">
        {testimonials.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
            No testimonials yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <article
                key={t.id}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {widget.showRating && t.rating && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < t.rating!
                            ? "h-5 w-5 fill-yellow-400 text-yellow-400"
                            : "h-5 w-5 fill-muted text-muted-foreground/30"
                        }
                      />
                    ))}
                  </div>
                )}
                {t.content && (
                  <p className="text-[15px] leading-relaxed text-foreground">
                    &ldquo;{t.content}&rdquo;
                  </p>
                )}
                <div className="mt-auto flex items-center gap-3 pt-1">
                  {widget.showAvatar &&
                    (t.customerAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.customerAvatar}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <LetterAvatar name={t.customerName} size={40} />
                    ))}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {t.customerName}
                    </p>
                    {t.customerTitle && (
                      <p className="text-xs text-muted-foreground">
                        {t.customerTitle}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Signup CTA — the real reason this page exists */}
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold">Want your own Wall of Love?</h2>
          <p className="mt-2 text-muted-foreground">
            Collect testimonials from your customers and share a page like
            this one in minutes. Free forever plan.
          </p>
          <Button size="lg" asChild className="mt-6">
            <Link href="/signup">
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card. Set up in 5 minutes.
          </p>
        </div>
      </main>

      {/* Watermark (free plan only) — doubles as a viral acquisition
          link. Every public wall URL a customer shares becomes a
          signup funnel. UTM params let us slice traffic by surface
          in PostHog / GA (utm_source=wall, utm_medium=hosted). */}
      {showWatermark && (
        <footer className="border-t bg-muted/30 py-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <Link
                href="/?utm_source=wall_of_love&utm_medium=hosted&utm_campaign=powered_by"
                className="font-semibold text-primary hover:underline"
              >
                Testimoni
              </Link>
            </p>
            <Link
              href="/?utm_source=wall_of_love&utm_medium=hosted&utm_campaign=build_your_own"
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              Build your own Wall of Love — free →
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}
