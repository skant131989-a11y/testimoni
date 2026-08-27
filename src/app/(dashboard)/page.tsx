import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MessageSquareQuote,
  Code2,
  Inbox,
  Eye,
  Plus,
  Share2,
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
    redirect("/onboarding");
  }

  const workspaceId = dbUser.workspaceMembers[0].workspaceId;

  // Fetch stats in parallel
  const [
    totalTestimonials,
    activeWidgets,
    pendingSubmissions,
    totalImpressions,
    recentTestimonials,
  ] = await Promise.all([
    prisma.testimonial.count({ where: { workspaceId } }),
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
  ]);

  const impressionsTotal = totalImpressions._sum.impressions ?? 0;

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your testimonials.
        </p>
      </div>

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
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/testimonials?action=add">
            <Plus className="mr-2 h-4 w-4" />
            Add Testimonial
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/widgets?action=create">
            <Code2 className="mr-2 h-4 w-4" />
            Create Widget
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/collect">
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
                <Link href="/collect">Get Started</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTestimonials.map((testimonial) => (
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
                  <Link href="/testimonials">View all testimonials</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
