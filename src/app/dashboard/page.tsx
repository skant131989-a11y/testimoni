import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  MessageSquareQuote,
  Code2,
  Inbox,
  Eye,
  Plus,
  Sparkles,
  ArrowRight,
  Search,
  RefreshCw,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MilestoneNudge } from "@/components/milestone-nudge";
import { VideoFreeBanner } from "@/components/video-free-banner";
import { FormUrlCard } from "@/components/form-url-card";
import { TrackedLink } from "@/components/tracked-link";
import { PageLoadPerf } from "@/components/page-load-perf";
import { MILESTONE_COUNTS } from "@/lib/milestones";
import { PlanLimitProgress } from "@/components/plan-limit-progress";
import { FindMyProofCard } from "@/components/dashboard/find-my-proof-card";
import { RotatingTip } from "@/components/dashboard/rotating-tip";
import { getEffectiveLimits } from "@/lib/plan";
import { getDbUserWithWorkspace, loadDbUserWithWorkspaceFresh } from "@/lib/session";
import {
  RecentTestimonialsCard,
  RecentTestimonialsSkeleton,
} from "./recent-testimonials";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  /** Optional destination — when set, the whole card becomes a link.
   *  Adds hover state (border tint + subtle lift) so it reads as
   *  interactive, and fires stat_card_clicked with the analytics
   *  key so we can see which stat drives the most curiosity. */
  href?: string;
  analyticsKey?: string;
}

function StatsCard({ title, value, icon, description, href, analyticsKey }: StatsCardProps) {
  const inner = (
    <Card
      className={
        href
          ? "transition-shadow hover:border-primary/40 hover:shadow-md"
          : undefined
      }
    >
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

  if (!href) return inner;
  return (
    <TrackedLink
      cta={`stat_card_${analyticsKey ?? "unknown"}`}
      surface="dashboard"
      href={href}
      className="block"
    >
      {inner}
    </TrackedLink>
  );
}

export default async function DashboardPage() {
  // Cached per-render — the layout already ran this exact call so
  // we get it back from the memo. Saves ~200-400ms per render.
  // Fresh-read fallback covers the first-visit case where the
  // cache returned null before the layout's provisioning $transaction
  // committed (see loadDbUserWithWorkspaceFresh docs).
  const dbUser =
    (await getDbUserWithWorkspace()) ??
    (await loadDbUserWithWorkspaceFresh());

  if (!dbUser || !dbUser.workspaceMembers[0]) {
    // Layout auto-provisions on entry; if we hit this the session is stale
    redirect("/login");
  }

  const membership = dbUser.workspaceMembers[0];
  const workspaceId = membership.workspaceId;
  const workspaceSlug = membership.workspace.slug;
  // Pull default widget + form + subscription from the cached shape.
  // These were duplicated inside the $transaction below on every
  // render; removing them shrinks the batch from 10 → 7 queries.
  const defaultWidget = membership.workspace.widgets[0] ?? null;
  const defaultForm = membership.workspace.forms[0] ?? null;
  const subscription = membership.workspace.subscription;

  // Batch every dashboard read into a single $transaction so Prisma
  // pipelines them as ONE round-trip. Was 10 queries; now 6 —
  // defaultWidget, defaultForm, and subscription are all pulled
  // from the React.cache()-memoized getDbUserWithWorkspace() call
  // above (which the layout already paid for this render).
  //
  // NOTE: recentTestimonials.findMany is deliberately NOT in this
  // batch — it lives in the <Suspense>-wrapped RecentTestimonialsCard
  // component below and streams in independently.
  const [
    totalTestimonials,
    approvedTestimonials,
    activeWidgets,
    pendingSubmissions,
    totalImpressions,
    videoCount,
  ] = await prisma.$transaction([
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
    prisma.testimonial.count({
      where: { workspaceId, videoStorageKey: { not: null } },
    }),
  ]);
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
    // Under-3 testimonials — sharing the form to collect more matters
    // MORE than embedding an almost-empty wall. Users who ship the
    // embed at 1-2 testimonials just display a thin wall. Get to real
    // proof first, then embed. (An embed CTA still fires below at
    // impressionsTotal === 0 once they have 3+ testimonials, and the
    // general "share your form" CTA fires at <5 as a fallback.)
    if (totalTestimonials < 3 && formShareHref) {
      return {
        kind: "share_form",
        title: `Only ${totalTestimonials} testimonial${totalTestimonials === 1 ? "" : "s"} so far — get more before you embed`,
        desc: "Share your collection form with your last few customers. Every submission lands in your inbox for one-click approval.",
        href: "/dashboard/collect",
        label: "Share your form",
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
    <div className="space-y-6">
      <PageLoadPerf surface="dashboard" />
      {/* Page heading */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your testimonials.
        </p>
      </div>

      {/* TOP — Find My Proof nudge. Users repeatedly said the wedge
          card should lead the dashboard, above everything else. Kept
          dismissible; localStorage remembers the choice. */}
      <FindMyProofCard surface="dashboard" dismissible />

      {/* Milestone celebration — fires ONLY when approvedTestimonials
          hits an exact milestone (1, 5, 10, 25, 50, 100). This is the
          hero moment; the rotating tip below hides itself when a
          milestone is showing so nothing competes for attention. */}
      {defaultWidget && wallUrl && MILESTONE_COUNTS.includes(approvedTestimonials) && (
        <MilestoneNudge
          approvedCount={approvedTestimonials}
          widgetId={defaultWidget.id}
          wallUrl={wallUrl}
        />
      )}

      {/* Stats cards — each links to the natural drill-down page for
          its value so users can click a number to see what's behind
          it. Impressions falls back to the widget page when no
          default widget exists yet. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Testimonials"
          value={totalTestimonials}
          icon={
            <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
          }
          href="/dashboard/testimonials"
          analyticsKey="testimonials"
        />
        <StatsCard
          title="Active Widgets"
          value={activeWidgets}
          icon={<Code2 className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/widgets"
          analyticsKey="widgets"
        />
        <StatsCard
          title="Pending Submissions"
          value={pendingSubmissions}
          icon={<Inbox className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/inbox"
          analyticsKey="inbox"
        />
        <StatsCard
          title="Total Impressions"
          value={impressionsTotal}
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/analytics"
          analyticsKey="impressions"
        />
      </div>

      {/* Quick actions — three focused CTAs a founder actually
          clicks: add a testimonial, extract one from a screenshot
          via AI, or find fresh praise tweets to import. "See my
          Wall" and "Manage widgets" moved to the sidebar where
          they belong; keeping them here diluted the row. */}
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/dashboard/import">
            <Plus className="mr-2 h-4 w-4" />
            Add testimonial
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/import?tab=screenshot">
            <Sparkles className="mr-2 h-4 w-4" />
            Extract from screenshot
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/sources">
            <RefreshCw className="mr-2 h-4 w-4" />
            Import from sources
          </Link>
        </Button>
        <PlanLimitProgress
          current={totalTestimonials}
          max={limits.maxTestimonials}
          resource="testimonials"
          upgradeSurface="dashboard_quick_actions"
        />
        <Button variant="outline" asChild>
          <a
            href="/tools/praise-tweet-finder"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Search className="mr-2 h-4 w-4" />
            Find praise tweets
          </a>
        </Button>
      </div>

      {/* Rotating tips — one-at-a-time notification strip that
          cycles ~every 7 seconds. Feels like a live nudge feed
          instead of the previous stacked-nudges wall. */}
      <RotatingTip
        state={{
          totalTestimonials,
          videoCount,
          activeWidgets,
          impressionsTotal,
          hasWallScoreRun: false,
          hasAskMyWall: false,
          hasFormLink: !!formShareHref,
        }}
        wallUrl={wallUrl ?? undefined}
      />

      {/* Form-link card — moved BELOW the stats + actions because
          users repeatedly said it dominated the top of the page,
          pushing everything else down. Keeps it visible for the
          share-the-form job, but as a secondary card. */}
      {formShareHref && (
        <FormUrlCard
          formUrl={`${process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io"}${formShareHref}`}
          surface="dashboard"
        />
      )}

      {/* Recent testimonials — streamed in via <Suspense> so the
          stats + FormUrlCard render immediately and this card fills
          in when its findMany returns. Was previously part of the
          big $transaction above and blocked everything on the
          slowest query. */}
      <Suspense fallback={<RecentTestimonialsSkeleton />}>
        <RecentTestimonialsCard
          workspaceId={workspaceId}
          formShareHref={formShareHref}
        />
      </Suspense>
    </div>
  );
}
