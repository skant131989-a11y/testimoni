import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MessageSquareQuote,
  Code2,
  Inbox,
  Eye,
  Plus,
  Share2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
import { MilestoneNudge } from "@/components/milestone-nudge";
import { VideoFreeBanner } from "@/components/video-free-banner";
import { MILESTONE_COUNTS } from "@/lib/milestones";
import { PlanLimitProgress } from "@/components/plan-limit-progress";
import { getEffectiveLimits } from "@/lib/plan";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
}

function StatsCard({ title, value, icon, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: {
      workspaceMembers: {
        include: { workspace: true },
        take: 1,
      },
    },
  });

  if (!dbUser || !dbUser.workspaceMembers[0]) {
    // Layout auto-provisions on entry; if we hit this the session is stale
    redirect("/login");
  }

  const workspaceId = dbUser.workspaceMembers[0].workspaceId;
  const workspaceSlug = dbUser.workspaceMembers[0].workspace.slug;

  // Fetch stats in parallel
  const [
    totalTestimonials,
    approvedTestimonials,
    activeWidgets,
    pendingSubmissions,
    totalImpressions,
    recentTestimonials,
    defaultWidget,
    defaultForm,
    videoCount,
  ] = await Promise.all([
    prisma.testimonial.count({ where: { workspaceId } }),
    prisma.testimonial.count({
      where: { workspaceId, status: "APPROVED" },
    }),
    prisma.widget.count({ where: { workspaceId, isActive: true } }),
    prisma.submission.count({
      where: {
        form: { workspaceId },
        status: "NEW",
      },
    }),
    prisma.widgetAnalytics.aggregate({
      where: { widget: { workspaceId } },
      _sum: { impressions: true },
    }),
    prisma.testimonial.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.widget.findFirst({
      where: { workspaceId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
    prisma.collectionForm.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
      select: { slug: true },
    }),
    prisma.testimonial.count({
      where: { workspaceId, videoStorageKey: { not: null } },
    }),
  ]);

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { plan: true },
  });
  const limits = getEffectiveLimits(workspaceSlug, subscription?.plan);

  const impressionsTotal = totalImpressions._sum.impressions ?? 0;
  const wallUrl = defaultWidget
    ? `${process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io"}/w/${defaultWidget.id}`
    : null;
  const embedHref = defaultWidget ? `/dashboard/widgets/${defaultWidget.id}/embed` : null;
  const formShareHref = defaultForm ? `/collect/${workspaceSlug}/${defaultForm.slug}` : null;

  // Next-best-action decision tree. Picks the single highest-value CTA
  // for the user's current state so /dashboard never feels like a
  // dead-end stats screen. Order matters: earlier branches win.
  type Nba = {
    kind: string;
    title: string;
    desc: string;
    href: string;
    label: string;
    external?: boolean;
  };
  const nba: Nba = (() => {
    if (pendingSubmissions > 0) {
      return {
        kind: "review_inbox",
        title: `You have ${pendingSubmissions} testimonial${pendingSubmissions === 1 ? "" : "s"} waiting for approval`,
        desc: "Approve or reject them in your inbox — approved ones flow into your Wall of Love automatically.",
        href: "/dashboard/inbox",
        label: "Review inbox",
      };
    }
    if (totalTestimonials === 0) {
      return {
        kind: "first_import",
        title: "Get your first testimonial live in 30 seconds",
        desc: "Paste any public X or LinkedIn post about your work — we pull the author, text, and star rating. No screenshots.",
        href: "/dashboard/import",
        label: "Import a tweet",
      };
    }
    if (impressionsTotal === 0 && embedHref) {
      return {
        kind: "copy_embed",
        title: "Nobody's seen your wall yet — put it on your site",
        desc: "One line of code drops your widget on any site: Framer, Webflow, WordPress, React, plain HTML. Or share the public URL directly.",
        href: embedHref,
        label: "Copy embed code",
      };
    }
    if (totalTestimonials < 5 && formShareHref) {
      return {
        kind: "share_form",
        title: `Get more testimonials — you have ${totalTestimonials}`,
        desc: "Share your collection form with your last few customers. Every submission lands in your inbox for one-click approval.",
        href: "/dashboard/collect",
        label: "Share your form",
      };
    }
    if (wallUrl) {
      return {
        kind: "share_wall",
        title: "Share your Wall of Love with the world",
        desc: "Drop the public URL in your Instagram bio, email signature, or a QR code. No signup needed to view.",
        href: wallUrl,
        label: "Open your wall",
        external: true,
      };
    }
    return {
      kind: "explore_widgets",
      title: "Try a different widget layout",
      desc: "Grid, Masonry, Carousel, List, or Marquee — pick the one that fits your site.",
      href: "/dashboard/widgets",
      label: "Explore widgets",
    };
  })();

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your testimonials.
        </p>
      </div>

      {/* Next best action — one clear CTA above stats so the page
          always feels forward-moving, never like a dead-end.
          Suppressed when a milestone card is showing below: the
          milestone is the "hero moment" (celebration + share nudge),
          so two purple cards stacked would compete for attention.
          Milestone dismissal is per-session so if the user closes
          it, they'll see "Do next" again on the next page load. */}
      {!MILESTONE_COUNTS.includes(approvedTestimonials) && (
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Do next
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {nba.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{nba.desc}</p>
            </div>
          </div>
          <Button asChild size="lg" className="shrink-0">
            {nba.external ? (
              <a href={nba.href} target="_blank" rel="noopener noreferrer">
                {nba.label} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            ) : (
              <Link href={nba.href}>
                {nba.label} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </Button>
        </div>
      </div>
      )}

      {/* Milestone celebration — fires when approvedTestimonials
          matches an exact milestone (1, 5, 10, 25, 50, 100). Encourages
          sharing at the moment social proof crosses a threshold. */}
      {defaultWidget && wallUrl && (
        <MilestoneNudge
          approvedCount={approvedTestimonials}
          widgetId={defaultWidget.id}
          wallUrl={wallUrl}
        />
      )}

      <VideoFreeBanner videoCount={videoCount} />

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Testimonials"
          value={totalTestimonials}
          icon={
            <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
          }
        />
        <StatsCard
          title="Active Widgets"
          value={activeWidgets}
          icon={<Code2 className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Pending Submissions"
          value={pendingSubmissions}
          icon={<Inbox className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Impressions"
          value={impressionsTotal}
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/dashboard/import">
            <Plus className="mr-2 h-4 w-4" />
            Add Testimonial
          </Link>
        </Button>
        <PlanLimitProgress
          current={totalTestimonials}
          max={limits.maxTestimonials}
          resource="testimonials"
          upgradeSurface="dashboard_quick_actions"
        />
        <Button variant="outline" asChild>
          <Link href="/dashboard/widgets">
            <Code2 className="mr-2 h-4 w-4" />
            Manage Widgets
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/collect">
            <Share2 className="mr-2 h-4 w-4" />
            Share Form
          </Link>
        </Button>
      </div>

      {/* Recent testimonials */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Testimonials</CardTitle>
          <CardDescription>
            Your latest testimonials across all sources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTestimonials.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquareQuote className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No testimonials yet. Start collecting feedback from your
                customers!
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/collect">Get Started</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTestimonials.map((testimonial: (typeof recentTestimonials)[number]) => (
                <div
                  key={testimonial.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  {/* Avatar */}
                  {testimonial.customerAvatar ? (
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

                  {/* Content */}
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

                  {/* Date */}
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
    </div>
  );
}
