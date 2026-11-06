import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, TrendingUp } from "lucide-react";
import { getEffectivePlan } from "@/lib/plan";
import { LockedPreview, UpgradeNudge } from "@/components/upgrade/upgrade-nudge";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { workspaceMembers: { include: { workspace: { include: { subscription: true } } } } },
  });

  if (!dbUser || !dbUser.workspaceMembers[0]) redirect("/login");
  const workspace = dbUser.workspaceMembers[0].workspace;
  const isFree = getEffectivePlan(workspace.slug, workspace.subscription?.plan) === "FREE";

  const [widgets, totalImpressions, recentAnalytics] = await Promise.all([
    prisma.widget.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true, layout: true },
    }),
    prisma.widgetAnalytics.aggregate({
      where: { widget: { workspaceId: workspace.id } },
      _sum: { impressions: true },
    }),
    prisma.widgetAnalytics.findMany({
      where: { widget: { workspaceId: workspace.id } },
      orderBy: { date: "desc" },
      take: 30,
      include: { widget: { select: { name: true } } },
    }),
  ]);

  const totalViews = totalImpressions._sum.impressions || 0;
  const rows = recentAnalytics.slice(0, 10);
  const shownRows = isFree ? rows.slice(0, 3) : rows;
  const lockedRows = isFree ? rows.slice(3) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track widget performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Widgets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{widgets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {recentAnalytics.length > 0
                ? Math.round(
                    recentAnalytics.reduce((sum, a) => sum + a.impressions, 0) / recentAnalytics.length
                  )
                : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAnalytics.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No analytics data yet. Embed a widget on your site to start tracking impressions.
            </p>
          ) : (
            <div className="space-y-2">
              {shownRows.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} />
              ))}
              {lockedRows.length > 0 && (
                <LockedPreview
                  surface="analytics_history"
                  title="Daily history for every widget"
                  description="See which days and which widgets get the views. Free shows your last 3 days."
                >
                  <div className="space-y-2">
                    {lockedRows.map((entry) => (
                      <ActivityRow key={entry.id} entry={entry} />
                    ))}
                  </div>
                </LockedPreview>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isFree && lockedRows.length === 0 && (
        <UpgradeNudge surface="analytics_history" title="See your full daily history with Pro">
          Pro keeps daily impressions for every widget, so you can see which pages your wall helps.
        </UpgradeNudge>
      )}
    </div>
  );
}

function ActivityRow({
  entry,
}: {
  entry: { id: string; date: Date; impressions: number; widget: { name: string } };
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="font-medium">{entry.widget.name}</p>
        <p className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{entry.impressions}</p>
        <p className="text-xs text-muted-foreground">impressions</p>
      </div>
    </div>
  );
}
