import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { LeadList, type LeadCard } from "./lead-list";
import { RunScanButton } from "./run-scan-button";
import { TabsWithProgress } from "@/components/tabs-with-progress";

/**
 * /admin/leads — "Testimoni Growth Engine" (spec section 6).
 * Server component: gates access (requireAdmin), queries the current
 * view's leads + tab counts + last scan stats + the funnel, and hands
 * everything to client components for the interactive parts (run
 * scan, per-lead actions).
 */

type View =
  | "best"
  | "praise"
  | "launched"
  | "opportunities"
  | "contacted"
  | "converted"
  | "contact_today";

const VALID_VIEWS: View[] = [
  "best",
  "praise",
  "launched",
  "opportunities",
  "contacted",
  "converted",
  "contact_today",
];

const HIGH_INTENT_THRESHOLD = 75;
const RECENT_DAYS = 30;

function whereForView(view: View): Prisma.LeadWhereInput {
  const recentSince = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  switch (view) {
    case "best":
      return { status: { in: ["NEW", "QUALIFIED", "DRAFT_READY"] } };
    case "praise":
      return { praiseCount: { gt: 0 } };
    case "launched":
      return { createdAt: { gte: recentSince } };
    case "opportunities":
      return {
        praiseCount: { gt: 0 },
        socialProofStatus: { in: ["NO_SOCIAL_PROOF", "WEAK_SOCIAL_PROOF"] },
        status: { notIn: ["IGNORED"] },
      };
    case "contacted":
      return { status: { in: ["CONTACTED", "REPLIED"] } };
    case "converted":
      return { status: { in: ["SIGNUP", "CONVERTED"] } };
    case "contact_today":
      return {
        score: { gte: HIGH_INTENT_THRESHOLD },
        socialProofStatus: { in: ["NO_SOCIAL_PROOF", "WEAK_SOCIAL_PROOF"] },
        founderName: { not: null },
        status: { notIn: ["CONTACTED", "REPLIED", "SIGNUP", "CONVERTED", "IGNORED"] },
        OR: [{ founderSocial: { not: null } }, { publicBusinessEmail: { not: null } }],
      };
  }
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { email } = await requireAdmin("/admin/leads");
  const params = await searchParams;
  const view: View = VALID_VIEWS.includes(params.view as View) ? (params.view as View) : "best";

  const [leads, counts, lastRun, funnel] = await Promise.all([
    prisma.lead.findMany({
      where: whereForView(view),
      orderBy: view === "launched" ? { createdAt: "desc" } : { score: "desc" },
      take: 100,
      include: { praiseSignals: { orderBy: { foundAt: "desc" }, take: 5 } },
    }),
    Promise.all(VALID_VIEWS.map((v) => prisma.lead.count({ where: whereForView(v) }))),
    prisma.leadScanRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.lead.groupBy({ by: ["status"], _count: true }),
  ]);

  const countMap: Record<View, number> = Object.fromEntries(
    VALID_VIEWS.map((v, i) => [v, counts[i]])
  ) as Record<View, number>;

  const tabs = [
    { label: "🔥 Best Prospects", value: "best" as View, count: countMap.best, href: "/admin/leads?view=best" },
    { label: "💬 Praise Found", value: "praise" as View, count: countMap.praise, href: "/admin/leads?view=praise" },
    { label: "🚀 Recently Launched", value: "launched" as View, count: countMap.launched, href: "/admin/leads?view=launched" },
    { label: "🧲 Social Proof Opportunities", value: "opportunities" as View, count: countMap.opportunities, href: "/admin/leads?view=opportunities" },
    { label: "📨 Contacted", value: "contacted" as View, count: countMap.contacted, href: "/admin/leads?view=contacted" },
    { label: "💰 Converted", value: "converted" as View, count: countMap.converted, href: "/admin/leads?view=converted" },
    { label: "🔥 Contact Today", value: "contact_today" as View, count: countMap.contact_today, href: "/admin/leads?view=contact_today" },
  ];

  const statusCount = (s: string) => funnel.find((f) => f.status === s)?._count ?? 0;
  const funnelSteps = [
    { label: "Found", count: funnel.reduce((sum, f) => sum + f._count, 0) },
    { label: "Praise detected", count: countMap.praise },
    { label: "Qualified", count: statusCount("QUALIFIED") + statusCount("DRAFT_READY") + statusCount("CONTACTED") + statusCount("REPLIED") + statusCount("SIGNUP") + statusCount("CONVERTED") },
    { label: "Contacted", count: statusCount("CONTACTED") + statusCount("REPLIED") + statusCount("SIGNUP") + statusCount("CONVERTED") },
    { label: "Replied", count: statusCount("REPLIED") + statusCount("SIGNUP") + statusCount("CONVERTED") },
    { label: "Signup", count: statusCount("SIGNUP") + statusCount("CONVERTED") },
    { label: "Paid", count: statusCount("CONVERTED") },
  ];

  const cards: LeadCard[] = leads.map((l) => ({
    id: l.id,
    companyName: l.companyName,
    productName: l.productName,
    website: l.website,
    founderName: l.founderName,
    founderSocial: l.founderSocial,
    publicBusinessEmail: l.publicBusinessEmail,
    source: l.source,
    sourceUrl: l.sourceUrl,
    category: l.category,
    score: l.score,
    scoreReason: l.scoreReason,
    socialProofStatus: l.socialProofStatus,
    status: l.status,
    praiseCount: l.praiseCount,
    praiseSignals: l.praiseSignals.map((s) => ({ source: s.source, url: s.url, excerpt: s.excerpt, author: s.author })),
    createdAt: l.createdAt.toISOString(),
    lastSeenAt: l.lastSeenAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Testimoni Growth Engine</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {email} · Human approval required before anything is sent.
            </p>
          </div>
          <RunScanButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {/* Last scan stats strip */}
        {lastRun && (
          <div className="grid grid-cols-2 gap-3 rounded-xl border bg-white p-4 text-sm sm:grid-cols-4">
            <Stat label="Companies scanned" value={lastRun.companiesScanned} />
            <Stat label="Praise signals found" value={lastRun.praiseSignalsFound} />
            <Stat label="New qualified leads" value={lastRun.newQualifiedLeads} />
            <Stat label="High-intent leads" value={lastRun.highIntentLeads} />
          </div>
        )}
        {lastRun?.providerErrors.length ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Last scan had provider issues (didn&rsquo;t block the run): {lastRun.providerErrors.join(" · ")}
          </p>
        ) : null}

        {/* Funnel */}
        <div className="overflow-x-auto rounded-xl border bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Funnel
          </p>
          <div className="flex min-w-max items-center gap-2">
            {funnelSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="rounded-lg border bg-slate-50 px-3 py-2 text-center">
                  <div className="text-lg font-bold">{step.count}</div>
                  <div className="text-[11px] text-muted-foreground">{step.label}</div>
                </div>
                {i < funnelSteps.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </div>

        <TabsWithProgress tabs={tabs} activeValue={view} />

        {/* key={view} — see the inbox bug: a client list seeded with
            useState(initial) must remount per tab or it goes stale on
            client-side nav between tabs. */}
        <LeadList key={view} initial={cards} view={view} />
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
