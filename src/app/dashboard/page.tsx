import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Plus, ArrowRight, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { MilestoneNudge } from "@/components/milestone-nudge";
import { FormUrlCard } from "@/components/form-url-card";
import { TrackedLink } from "@/components/tracked-link";
import { PageLoadPerf } from "@/components/page-load-perf";
import { MILESTONE_COUNTS } from "@/lib/milestones";
import { MentionsBanner } from "@/components/dashboard/mentions-banner";
import {
  GettingStarted,
  GETTING_STARTED_STEPS,
  gettingStartedDone,
} from "@/components/dashboard/getting-started";
import { getEffectiveLimits, getEffectivePlan } from "@/lib/plan";
import { getDbUserWithWorkspace, loadDbUserWithWorkspaceFresh } from "@/lib/session";
import {
  RecentTestimonialsCard,
  RecentTestimonialsSkeleton,
} from "./recent-testimonials";
import { FreeLimitBanner } from "@/components/upgrade/free-limit-banner";
import { TrialBanner } from "@/components/upgrade/trial-banner";
import { ScanAllowance } from "@/components/upgrade/scan-allowance";
import { getAccountScanUsage } from "@/lib/scan-limits";

interface StatsCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  description?: string;
  /** Optional destination — when set, the whole card becomes a link.
   *  Adds hover state (border tint + subtle lift) so it reads as
   *  interactive, and fires stat_card_clicked with the analytics
   *  key so we can see which stat drives the most curiosity. */
  href?: string;
  analyticsKey?: string;
}

function StatsCard({ title, value, description, href, analyticsKey }: StatsCardProps) {
  const inner = (
    <div
      className={
        "rounded-2xl border border-violet-200/70 bg-card px-4 py-3 " +
        (href ? "transition-shadow hover:border-primary/40 hover:shadow-md" : "")
      }
    >
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-2xl font-bold">{value.toLocaleString()}</p>
      {description && <p className="text-[11px] font-medium text-emerald-600">{description}</p>}
    </div>
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
  const plan = getEffectivePlan(workspaceSlug, subscription?.plan);
  const isPro = plan !== "FREE";
  // Started now so it runs alongside the stats query below.
  const scanUsagePromise = getAccountScanUsage(dbUser.id, isPro ? "pro" : "free");

  // All six counters in ONE statement = ONE database round-trip.
  // The old $transaction([...]) sent BEGIN + 6 queries + COMMIT one
  // after another (8 round-trips), which is what made this page slow
  // whenever the database was far from the function.
  //
  // NOTE: recentTestimonials.findMany is deliberately NOT in here —
  // it lives in the <Suspense>-wrapped RecentTestimonialsCard below
  // and streams in independently.
  const [stats] = await prisma.$queryRaw<
    {
      total: number;
      approved: number;
      widgets: number;
      pending: number;
      impressions: number;
      videos: number;
      trial_ends: Date | null;
    }[]
  >`
    SELECT
      (SELECT count(*) FROM testimonials WHERE workspace_id = ${workspaceId})::int AS total,
      (SELECT count(*) FROM testimonials WHERE workspace_id = ${workspaceId} AND status = 'APPROVED')::int AS approved,
      (SELECT count(*) FROM widgets WHERE workspace_id = ${workspaceId} AND is_active = true)::int AS widgets,
      (SELECT count(*) FROM submissions s JOIN collection_forms f ON f.id = s.form_id
         WHERE f.workspace_id = ${workspaceId} AND s.status = 'NEW')::int AS pending,
      (SELECT COALESCE(sum(a.impressions), 0) FROM widget_analytics a JOIN widgets w ON w.id = a.widget_id
         WHERE w.workspace_id = ${workspaceId})::int AS impressions,
      (SELECT count(*) FROM testimonials WHERE workspace_id = ${workspaceId} AND video_storage_key IS NOT NULL)::int AS videos,
      (SELECT ends_at FROM pro_trials WHERE workspace_id = ${workspaceId}) AS trial_ends
  `;
  const totalTestimonials = stats?.total ?? 0;
  const approvedTestimonials = stats?.approved ?? 0;
  const pendingSubmissions = stats?.pending ?? 0;
  const limits = getEffectiveLimits(workspaceSlug, subscription?.plan);
  const scanUsage = await scanUsagePromise;

  // The 14-day Pro trial: offered once to Free accounts that never paid,
  // then a "days left" banner until it ends.
  const everPaid = Boolean(subscription?.stripeSubscriptionId || subscription?.razorpaySubscriptionId);
  const trialEnds = stats?.trial_ends ? new Date(stats.trial_ends) : null;
  const trialActive = isPro && !everPaid && !!trialEnds && trialEnds.getTime() > Date.now();
  const trialEligible = !isPro && !everPaid && !trialEnds && !subscription?.grantedUntil;
  const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86_400_000)) : 0;

  const impressionsTotal = stats?.impressions ?? 0;
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

  // Offer the trial once there is something for Pro to work on (a
  // testimonial, or a scan already run). An empty new account would burn
  // its one trial on nothing, so it sees only the "Next step" card; the
  // trial is also offered at the Pro limits (requests, proof placement).
  const trialActivated = totalTestimonials >= 1 || scanUsage.used > 0;
  const showTrialOffer = trialEligible && trialActivated;

  const nbaCard = (
    <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-violet-900 via-violet-800 to-violet-600 p-5 text-white shadow-lg shadow-violet-900/15 sm:flex-row sm:items-center sm:justify-between md:p-6">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-200">Next step</p>
        <p className="mt-1 text-xl font-bold leading-tight md:text-2xl">{nba.title}</p>
        <p className="mt-1.5 text-sm text-violet-200">{nba.desc}</p>
      </div>
      <Button asChild className="shrink-0 bg-white text-violet-900 hover:bg-violet-50">
        {nba.external ? (
          <a href={nba.href} target="_blank" rel="noopener noreferrer">
            {nba.label} <ArrowRight className="ml-1.5 h-4 w-4" />
          </a>
        ) : (
          <TrackedLink cta={"nba_" + nba.kind} surface="dashboard" href={nba.href}>
            {nba.label} <ArrowRight className="ml-1.5 h-4 w-4" />
          </TrackedLink>
        )}
      </Button>
    </div>
  );

  // ONE card for "what to do now". Priority: at the free limit (trial or
  // upgrade) > getting started (inbox, first testimonial, embed) > the trial
  // offer > the general next step. The website question / scan result from
  // MentionsBanner takes this slot first while that flow is active.
  const maxT = limits.maxTestimonials;
  const atLimit = !isPro && Number.isFinite(maxT) && totalTestimonials >= maxT;
  const onboardingDone = gettingStartedDone(totalTestimonials, impressionsTotal) === GETTING_STARTED_STEPS;
  let topCard: React.ReactNode;
  if (atLimit) {
    topCard = showTrialOffer ? <TrialBanner state="eligible" /> : <FreeLimitBanner count={totalTestimonials} max={maxT} />;
  } else if (nba.kind === "review_inbox") {
    // Something is waiting for their approval: that comes before anything else.
    topCard = nbaCard;
  } else if (!onboardingDone) {
    // The 3-step guide: add one, get to three, put the wall on a site.
    topCard = (
      <GettingStarted testimonials={totalTestimonials} impressions={impressionsTotal} embedHref={embedHref} />
    );
  } else if (showTrialOffer) {
    topCard = <TrialBanner state="eligible" />;
  } else {
    topCard = nbaCard;
  }
  const firstName = dbUser.name?.trim().split(/\s+/)[0] ?? "";
  // Only worth a line when the free scans are nearly gone.
  const scansNearlyOut = Number.isFinite(scanUsage.limit) && scanUsage.limit - scanUsage.used <= 2;

  return (
    <div className="space-y-6">
      <PageLoadPerf surface="dashboard" />
      {/* Greeting, with the two everyday actions beside it */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{membership.workspace.name}</p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/sources">
              <RefreshCw className="mr-2 h-4 w-4" />
              Import
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/import">
              <Plus className="mr-2 h-4 w-4" />
              Add testimonial
            </Link>
          </Button>
        </div>
      </div>

      {trialActive && <TrialBanner state="active" daysLeft={trialDaysLeft} />}

      {/* The single "what now" slot: the website question / scan result
          while that flow is active, otherwise the card chosen above. */}
      <MentionsBanner where="home" fallback={topCard} />

      {scansNearlyOut && <ScanAllowance used={scanUsage.used} limit={scanUsage.limit} isPro={isPro} />}

      {/* Milestone celebration: fires only at an exact milestone (1, 5, 10, 25, 50, 100). */}
      {defaultWidget && wallUrl && MILESTONE_COUNTS.includes(approvedTestimonials) && (
        <MilestoneNudge
          approvedCount={approvedTestimonials}
          widgetId={defaultWidget.id}
          wallUrl={wallUrl}
        />
      )}

      {/* Three quiet numbers, each linking to the page behind it. */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard
          title="Live on your wall"
          value={approvedTestimonials}
          href="/dashboard/testimonials"
          analyticsKey="testimonials"
        />
        <StatsCard
          title="Waiting for you"
          value={pendingSubmissions}
          description={pendingSubmissions === 0 ? "All caught up" : undefined}
          href="/dashboard/inbox"
          analyticsKey="inbox"
        />
        <StatsCard
          title="Wall views"
          value={impressionsTotal}
          href="/dashboard/analytics"
          analyticsKey="impressions"
        />
      </div>

      {/* Form-link card: the share-the-form job, as a secondary card. */}
      {formShareHref && (
        <FormUrlCard
          formUrl={`${process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io"}${formShareHref}`}
          surface="dashboard"
        />
      )}

      {/* Recent testimonials: streamed in via <Suspense> so everything above
          renders immediately and this card fills in when its query returns. */}
      <Suspense fallback={<RecentTestimonialsSkeleton />}>
        <RecentTestimonialsCard
          workspaceId={workspaceId}
          formShareHref={formShareHref}
        />
      </Suspense>
    </div>
  );
}
