import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { getEffectivePlan, getEffectiveLimits } from "@/lib/plan";
import { InboxList, type InboxSubmission } from "./inbox-list";

type FilterTab = "NEW" | "APPROVED" | "REJECTED";

interface InboxPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: { workspaceMembers: { include: { workspace: true }, take: 1 } },
  });

  if (!dbUser || !dbUser.workspaceMembers[0]) redirect("/dashboard");

  const workspaceId = dbUser.workspaceMembers[0].workspaceId;
  const workspaceSlug = dbUser.workspaceMembers[0].workspace.slug;
  const activeFilter: FilterTab =
    (params.filter?.toUpperCase() as FilterTab) || "NEW";

  const [submissions, counts, subscription, testimonialCount, defaultWidget] = await Promise.all([
    prisma.submission.findMany({
      where: {
        status: activeFilter,
        form: { workspaceId },
      },
      orderBy: { createdAt: "desc" },
      include: { form: { select: { name: true } } },
    }),
    prisma.submission.groupBy({
      by: ["status"],
      where: { form: { workspaceId } },
      _count: true,
    }),
    prisma.subscription.findUnique({ where: { workspaceId } }),
    prisma.testimonial.count({ where: { workspaceId } }),
    // Default widget = oldest active. Same one the approve API adds
    // testimonials to — we need its id upfront so the client can show
    // the "View wall" CTA optimistically without waiting for the API.
    prisma.widget.findFirst({
      where: { workspaceId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const effectivePlan = getEffectivePlan(workspaceSlug, subscription?.plan);
  const effectiveLimits = getEffectiveLimits(workspaceSlug, subscription?.plan);
  const atTestimonialLimit = testimonialCount >= effectiveLimits.maxTestimonials;

  const countMap: Record<string, number> = {};
  for (const g of counts) countMap[g.status] = g._count;

  const tabs: { label: string; value: FilterTab; count: number }[] = [
    { label: "New", value: "NEW", count: countMap["NEW"] ?? 0 },
    { label: "Approved", value: "APPROVED", count: countMap["APPROVED"] ?? 0 },
    { label: "Rejected", value: "REJECTED", count: countMap["REJECTED"] ?? 0 },
  ];

  const inboxSubmissions: InboxSubmission[] = submissions.map((s) => ({
    id: s.id,
    customerName: s.customerName,
    customerEmail: s.customerEmail,
    content: s.content,
    rating: s.rating,
    createdAt: s.createdAt.toISOString(),
    formName: s.form.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
        <p className="text-muted-foreground">
          Review submissions from your collection forms. Approve to add them to your testimonials.
        </p>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/inbox?filter=${tab.value.toLowerCase()}`}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeFilter === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                activeFilter === tab.value
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      <InboxList
        initial={inboxSubmissions}
        activeFilter={activeFilter}
        atTestimonialLimit={atTestimonialLimit}
        testimonialCount={testimonialCount}
        maxTestimonials={effectiveLimits.maxTestimonials}
        isFree={effectivePlan === "FREE"}
        defaultWidgetId={defaultWidget?.id ?? null}
        defaultWidgetName={defaultWidget?.name ?? null}
      />
    </div>
  );
}
