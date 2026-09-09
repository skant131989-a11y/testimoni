import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { Star, ArrowRight, Twitter, Linkedin, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import { LetterAvatar } from "@/components/letter-avatar";
import { VideoTestimonialCard } from "@/components/video-testimonial-card";
import { PageEngagement } from "@/components/page-engagement";
import { InlineSignup } from "@/components/inline-signup";
import { WallShareButtons } from "@/components/wall-share-buttons";
import { absoluteUrl } from "@/lib/utils";

interface WallPageProps {
  params: Promise<{ widgetId: string }>;
  searchParams: Promise<{ showcase?: string }>;
}

// Background revalidation — after 5 minutes the next visitor
// triggers a fresh DB fetch while everyone else keeps getting the
// cached copy. New approved testimonials show up within 5min on
// the wall without a manual invalidation. If we need faster,
// invalidate the cache tag from the testimonial approve/edit
// endpoints (see revalidateTag docs).
export const revalidate = 300;

// Two-layer cache:
// 1. `unstable_cache` — persists across requests + across regions,
//    keyed on widgetId + tagged for on-demand invalidation.
// 2. `cache()` — de-dupes calls WITHIN a single request. Without
//    this, generateMetadata + the page render run the same query
//    twice (~30-80ms wasted per page load).
const fetchWidgetFromDb = unstable_cache(
  async (widgetId: string) =>
    prisma.widget.findUnique({
      where: { id: widgetId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            subscription: { select: { plan: true } },
            // First active collection form — used as the target of the
            // "Testify for X" flow. Every workspace has at least one
            // form after provisioning; guard for the rare zero-forms
            // case downstream anyway.
            forms: {
              where: { isActive: true },
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { slug: true },
            },
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
    }),
  ["widget-page"],
  {
    revalidate: 300,
    // Tag the cache entry so approve / edit / archive endpoints can
    // call `revalidateTag(\`widget:\${id}\`)` for instant refresh
    // without waiting 5 minutes.
    tags: ["widget-page"],
  }
);

const getWidget = cache(async (widgetId: string) => fetchWidgetFromDb(widgetId));

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
// public accounts on X / LinkedIn / Reddit / HN / PH." Manual entries
// render nothing; no source is better than a vague label.
function SourceBadge({
  source,
  sourceUrl,
}: {
  source: string | null;
  sourceUrl: string | null;
}) {
  if (!source || source === "MANUAL" || source === "IMPORT") return null;

  // Map every recognised source to its display config. Reddit / HN /
  // PH don't have lucide icons, so we render the mono glyph inline.
  const config: Record<
    string,
    { label: string; iconKey: "twitter" | "linkedin" | "reddit" | "hn" | "ph" }
  > = {
    TWITTER: { label: "Posted on X", iconKey: "twitter" },
    LINKEDIN: { label: "Posted on LinkedIn", iconKey: "linkedin" },
    REDDIT: { label: "Posted on Reddit", iconKey: "reddit" },
    HACKER_NEWS: { label: "Posted on Hacker News", iconKey: "hn" },
    PRODUCT_HUNT: { label: "Posted on Product Hunt", iconKey: "ph" },
  };
  const c = config[source];
  if (!c) return null;

  const icon =
    c.iconKey === "twitter" ? (
      <Twitter className="h-3 w-3" />
    ) : c.iconKey === "linkedin" ? (
      <Linkedin className="h-3 w-3" />
    ) : c.iconKey === "reddit" ? (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.2 11.8c.03.2.05.4.05.61 0 3.1-3.6 5.61-8.05 5.61s-8.05-2.51-8.05-5.61c0-.21.02-.41.05-.61C.34 13.42 0 12.76 0 12c0-1.24.94-2.24 2.1-2.24.59 0 1.13.26 1.51.68 1.5-1.05 3.55-1.73 5.83-1.83l1.11-5.16c.03-.11.15-.19.26-.16l3.62.77c.24-.5.77-.85 1.38-.85.85 0 1.55.68 1.55 1.53 0 .84-.7 1.52-1.55 1.52-.83 0-1.51-.65-1.55-1.47l-3.28-.7-1 4.66c2.27.1 4.32.79 5.83 1.84.38-.42.92-.68 1.51-.68 1.16 0 2.1 1 2.1 2.24 0 .76-.34 1.42-.86 1.8z" />
      </svg>
    ) : c.iconKey === "hn" ? (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M0 0v24h24V0H0zm13.5 12.5V19h-3v-6.5L6 5h3l3 5 3-5h3l-4.5 7.5z" />
      </svg>
    ) : (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm1.4 13.5H10v3.7H7.2V6.7H13c2.6 0 4.4 1.7 4.4 3.9-.1 2.2-1.9 2.9-4 2.9zm-.1-4.4H10v2.7h3.3c1 0 1.6-.5 1.6-1.4-.1-.8-.7-1.3-1.6-1.3z" />
      </svg>
    );

  const inner = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      {icon}
      {c.label}
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
      {icon}
      {c.label}
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

export default async function HostedWallPage({
  params,
  searchParams,
}: WallPageProps) {
  const { widgetId } = await params;
  const { showcase } = await searchParams;
  const widget = await getWidget(widgetId);

  if (!widget || !widget.isActive) {
    notFound();
  }

  const plan = getEffectivePlan(
    widget.workspace.slug,
    widget.workspace.subscription?.plan
  );
  // The signup + testify surfaces normally render only on FREE plan
  // walls (Pro users pay to remove Testimoni nudges). Two overrides
  // force them ON regardless of plan:
  //   1. `?showcase=1` — used by /w/demo redirects so visitors from
  //      marketing pages always hit a wall that converts.
  //   2. The founder's own workspace ("founder") — /w/... links to
  //      this wall are the primary marketing surface for signup and
  //      cross-founder testify. It's the demo destination, so it
  //      needs to convert every visitor, not fall silent because
  //      the founder happens to be on Pro.
  const isShowcase = showcase === "1";
  const isShowcaseWorkspace = widget.workspace.slug === "founder";
  const showWatermark = plan === "FREE" || isShowcase || isShowcaseWorkspace;

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

          {/* Share buttons — 6 surfaces across two rows. See
              WallShareButtons for the full rationale. Only rendered
              once the wall actually has content; a bare page with
              share icons feels performative. */}
          {count > 0 && (
            <WallShareButtons
              wallUrl={wallUrl}
              workspaceName={workspaceName}
              reviewCount={count}
            />
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
      {/* "Add your voice" — visitor-endorsement surface. Anyone who
          used or interacted with the workspace can drop a 2-line
          testimonial directly into the workspace's own collection
          form. Every submission lands as PENDING for the owner to
          approve before appearing on the wall. Anchor id="testify"
          so any future cross-linking (founder profiles, share
          buttons, external prompts) can jump straight here. */}
      {widget.workspace.forms[0] && (
        <section
          id="testify"
          className="scroll-mt-16 border-t bg-background py-14"
        >
          <div className="mx-auto max-w-3xl px-4 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Add your voice
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Used {workspaceName}? Say something.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              Share what worked (or didn&rsquo;t) in 2 sentences — it
              lands in the inbox for review before appearing.
            </p>
            <a
              href={`/collect/${widget.workspace.slug}/${widget.workspace.forms[0].slug}?src=testify`}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Write a testimonial <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-3 text-xs text-muted-foreground">
              Takes 30 seconds · Owner approves before it appears
              on the wall
            </p>
          </div>
        </section>
      )}

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

      {/* Wall footer — split into two logical blocks:
          • Marketing block ("Made with Testimoni" + "Build your own"
            pill) — plan-gated. Free plan renders it; Pro pays to
            remove the promotion.
          • Utility block ("Log in →") — always renders. It's a
            tiny text link visitors need if they already have an
            account and clicked here from a shared wall URL. Even
            Pro walls keep this: it's utility, not commerce.

          Both blocks live inside a single <footer> so vertical
          spacing stays consistent whether one or both render. */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 text-center">
          {showWatermark && (
            <>
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
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login?utm_source=wall_of_love&utm_medium=hosted&utm_campaign=login_link"
              className="font-medium text-primary hover:underline"
            >
              Log in →
            </Link>
          </p>
        </div>
      </footer>
      {/* Anonymous view tracking — never attributes wall views to the
          logged-in user (workspace owners visit their own walls a lot;
          that would inflate metrics). */}
      <PageEngagement surface="wall" anonymous />
    </div>
  );
}
