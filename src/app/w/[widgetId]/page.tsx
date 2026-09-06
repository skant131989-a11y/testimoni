import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, ArrowRight, Twitter, Linkedin, Share2, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { LetterAvatar } from "@/components/letter-avatar";
import { VideoTestimonialCard } from "@/components/video-testimonial-card";
import { PageEngagement } from "@/components/page-engagement";
import { InlineSignup } from "@/components/inline-signup";
import { absoluteUrl } from "@/lib/utils";

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
              videoUrl: true,
              source: true,
              sourceUrl: true,
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
  const count = widget.testimonials.length;
  const title = count
    ? `${count} people love ${widget.workspace.name}`
    : `${widget.workspace.name} — Wall of Love`;
  const description = count
    ? `Real reviews from ${count} ${count === 1 ? "person" : "people"} using ${widget.workspace.name}.`
    : `Wall of Love for ${widget.workspace.name}. Powered by Testimoni.`;
  return {
    title,
    description,
    alternates: { canonical: `/w/${widgetId}` },
    openGraph: { title, description, url: `/w/${widgetId}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Small chip that surfaces where a testimonial came from. Instant
// credibility signal — "these aren't fabricated, they came from real
// public accounts on X / LinkedIn." Manual entries render nothing;
// no source is better than a vague label.
function SourceBadge({
  source,
  sourceUrl,
}: {
  source: string | null;
  sourceUrl: string | null;
}) {
  if (!source || source === "MANUAL" || source === "IMPORT") return null;
  const isTwitter = source === "TWITTER";
  const isLinkedIn = source === "LINKEDIN";
  if (!isTwitter && !isLinkedIn) return null;
  const label = isTwitter ? "Posted on X" : "Posted on LinkedIn";
  const Icon = isTwitter ? Twitter : Linkedin;
  const inner = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
  if (!sourceUrl) return inner;
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
    >
      <Icon className="h-3 w-3" />
      {label}
    </a>
  );
}

// Reusable body: strips oEmbed's trailing "…" and replaces it with a
// "read full →" link back to source when we have one. Renders the
// stars if requested. Used by both featured + grid cards.
function TestimonialBody({
  testimonial: t,
  showRating,
  size = "default",
}: {
  testimonial: {
    id: string;
    content: string | null;
    rating: number | null;
    sourceUrl: string | null;
  };
  showRating: boolean;
  size?: "default" | "featured";
}) {
  const bodySize =
    size === "featured"
      ? "text-xl leading-relaxed md:text-2xl"
      : "text-[15px] leading-relaxed";
  return (
    <>
      {showRating && t.rating && (
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                i < t.rating!
                  ? size === "featured"
                    ? "h-6 w-6 fill-yellow-400 text-yellow-400"
                    : "h-5 w-5 fill-yellow-400 text-yellow-400"
                  : size === "featured"
                    ? "h-6 w-6 fill-muted text-muted-foreground/30"
                    : "h-5 w-5 fill-muted text-muted-foreground/30"
              }
            />
          ))}
        </div>
      )}
      {t.content &&
        (() => {
          const trimmed = t.content.replace(/\s*…\s*$/, "");
          const wasTruncated = trimmed !== t.content;
          return (
            <p className={`${bodySize} text-foreground`}>
              &ldquo;{trimmed}&rdquo;
              {wasTruncated && t.sourceUrl && (
                <>
                  {" "}
                  <a
                    href={t.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-primary"
                  >
                    read full →
                  </a>
                </>
              )}
            </p>
          );
        })()}
    </>
  );
}

// Author strip + optional source badge. Shared between featured card
// (row above the badge) and the grid.
function AuthorStrip({
  t,
  showAvatar,
  avatarSize = 40,
}: {
  t: {
    customerAvatar: string | null;
    customerName: string;
    customerTitle: string | null;
    customerUrl: string | null;
    source: string | null;
    sourceUrl: string | null;
  };
  showAvatar: boolean;
  avatarSize?: number;
}) {
  const px = `h-${avatarSize === 56 ? "14" : "10"} w-${avatarSize === 56 ? "14" : "10"}`;
  return (
    <div className="mt-auto flex items-center justify-between gap-3 pt-1">
      <div className="flex min-w-0 items-center gap-3">
        {showAvatar &&
          (t.customerAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.customerAvatar}
              alt=""
              className={`${px} shrink-0 rounded-full object-cover`}
            />
          ) : (
            <LetterAvatar name={t.customerName} size={avatarSize} />
          ))}
        <div className="min-w-0">
          <p
            className={`font-bold text-foreground ${avatarSize === 56 ? "text-base" : "text-sm"}`}
          >
            {t.customerName}
          </p>
          {t.customerTitle && (
            <p className="truncate text-xs text-muted-foreground">
              {t.customerTitle}
            </p>
          )}
        </div>
      </div>
      <SourceBadge source={t.source} sourceUrl={t.sourceUrl} />
    </div>
  );
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

  // Aggregate proof — the count + average rating shown in the hero.
  // Even a single 5-star review is worth surfacing; the alternative
  // is a bare "Wall of Love" heading that says nothing.
  const count = testimonials.length;
  const withRating = testimonials.filter((t) => t.rating);
  const avg =
    withRating.length > 0
      ? withRating.reduce((sum, t) => sum + (t.rating || 0), 0) /
        withRating.length
      : 0;
  const avgRounded = Math.round(avg * 10) / 10;

  // Featured = the first testimonial (workspace owner controls order
  // via widget ordering). Renders larger + centered above the grid so
  // one great quote anchors the page.
  const featured = testimonials[0];
  const rest = testimonials.slice(1);

  const workspaceName = widget.workspace.name;
  const wallUrl = absoluteUrl(`/w/${widgetId}`);

  // Share-CTA URLs. Any visitor who's impressed can amplify the wall
  // in one click. Pre-filled caption reads as a genuine recommendation,
  // not marketing — "Real reviews of X 🩷".
  const shareText = count
    ? `Real reviews of ${workspaceName} 🩷`
    : `Check out ${workspaceName}'s Wall of Love`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(wallUrl)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(wallUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/60 via-background to-background">
      {/* Hero — leads with aggregate proof, not a generic label */}
      <header className="mx-auto max-w-5xl px-4 pt-12 pb-10 md:pt-16">
        <div className="flex flex-col items-center gap-3 text-center">
          {widget.workspace.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={widget.workspace.logoUrl}
              alt={workspaceName}
              className="h-14 w-14 rounded-full object-cover shadow-sm ring-1 ring-primary/10"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-sm">
              {workspaceName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {count > 0 ? (
              <>
                Everyone&rsquo;s loving{" "}
                <span className="text-primary">{workspaceName}</span>.
              </>
            ) : (
              <>
                <span className="text-primary">{workspaceName}</span> — Wall of
                Love
              </>
            )}
          </h1>
          {count > 0 ? (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-lg text-muted-foreground">
              {avg > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < Math.round(avg)
                            ? "h-5 w-5 fill-yellow-400 text-yellow-400"
                            : "h-5 w-5 fill-muted text-muted-foreground/30"
                        }
                      />
                    ))}
                  </span>
                  <span className="font-semibold text-foreground">
                    {avgRounded}
                  </span>
                </span>
              )}
              <span>
                <span className="font-semibold text-foreground">{count}</span>{" "}
                {count === 1 ? "review" : "reviews"}
              </span>
            </div>
          ) : (
            <p className="text-lg text-muted-foreground">
              First reviews coming in — check back soon.
            </p>
          )}

          {/* Share buttons — visitors who love the wall can amplify.
              Every share is a free acquisition surface for the workspace
              owner. */}
          {count > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full"
              >
                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-3.5 w-3.5" />
                  Share on X
                </a>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full"
              >
                <a
                  href={linkedinShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  Share on LinkedIn
                </a>
              </Button>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Share2 className="h-3 w-3" />
                Loved this? Pass it on.
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        {testimonials.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed bg-card p-12 text-center">
            <p className="text-lg font-medium text-foreground">
              Nothing here yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first — reach out to {workspaceName} and leave a note.
            </p>
          </div>
        ) : (
          <>
            {/* Featured testimonial — bigger, centered, sets the tone */}
            {featured && (
              <article className="mx-auto mb-8 flex max-w-3xl flex-col gap-4 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-8 shadow-sm md:p-10">
                {featured.videoUrl && (
                  <VideoTestimonialCard
                    videoUrl={featured.videoUrl}
                    customerName={featured.customerName}
                  />
                )}
                <TestimonialBody
                  testimonial={featured}
                  showRating={widget.showRating}
                  size="featured"
                />
                <AuthorStrip
                  t={featured}
                  showAvatar={widget.showAvatar}
                  avatarSize={56}
                />
              </article>
            )}

            {/* Rest of the wall */}
            {rest.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((t) => (
                  <article
                    key={t.id}
                    className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {t.videoUrl && (
                      <VideoTestimonialCard
                        videoUrl={t.videoUrl}
                        customerName={t.customerName}
                      />
                    )}
                    <TestimonialBody
                      testimonial={t}
                      showRating={widget.showRating}
                    />
                    <AuthorStrip t={t} showAvatar={widget.showAvatar} />
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Aspirational "get your own" section — free plan only. Sits
          BELOW the testimonials on purpose: visitors read the wall
          first, feel the momentum, then see the form. Left side sells
          the outcome, right side is the actual signup — same
          component the home page uses, so conversion behaves the same
          across surfaces. */}
      {showWatermark && (
        <section className="border-t bg-gradient-to-b from-primary/[0.03] to-primary/[0.08] py-16">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Your turn
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Get a wall like this — in 30 seconds.
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Free forever. Collect testimonials from your customers,
                embed with one line, or share a page like this one.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">✓</span>
                  Hosted Wall of Love URL (like the one you&rsquo;re on)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">✓</span>
                  Import from X, LinkedIn, or a collection form
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">✓</span>
                  One-line embed for your site
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">✓</span>
                  No credit card. Set up in 30 seconds.
                </li>
              </ul>
            </div>
            <div>
              <InlineSignup source="wall_of_love" idPrefix="wall" />
            </div>
          </div>
        </section>
      )}

      {/* Testimoni watermark — small, footer-only. Free plan gets it,
          Pro removes. Never competes with the workspace's content for
          attention above the fold. */}
      {showWatermark && (
        <footer className="border-t bg-muted/30 py-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Made with{" "}
              <span aria-hidden className="text-primary">
                🩷
              </span>{" "}
              on{" "}
              <Link
                href="/?utm_source=wall_of_love&utm_medium=hosted&utm_campaign=made_with"
                className="font-semibold text-primary hover:underline"
              >
                Testimoni
              </Link>
            </p>
            <Link
              href="/signup?utm_source=wall_of_love&utm_medium=hosted&utm_campaign=build_your_own"
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              Build your own Wall of Love — free{" "}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </footer>
      )}
      {/* Anonymous view tracking — never attributes wall views to the
          logged-in user (workspace owners visit their own walls a lot;
          that would inflate metrics). */}
      <PageEngagement surface="wall" anonymous />
    </div>
  );
}
