import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, X, Star, Mail, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FilterTab = "NEW" | "APPROVED" | "REJECTED";

interface InboxPageProps {
  searchParams: Promise<{ filter?: string; error?: string }>;
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
  const activeFilter: FilterTab =
    (params.filter?.toUpperCase() as FilterTab) || "NEW";

  const [submissions, counts] = await Promise.all([
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
  ]);

  const countMap: Record<string, number> = {};
  for (const g of counts) countMap[g.status] = g._count;

  const tabs: { label: string; value: FilterTab; count: number }[] = [
    { label: "New", value: "NEW", count: countMap["NEW"] ?? 0 },
    { label: "Approved", value: "APPROVED", count: countMap["APPROVED"] ?? 0 },
    { label: "Rejected", value: "REJECTED", count: countMap["REJECTED"] ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
        <p className="text-muted-foreground">
          Review submissions from your collection forms. Approve to add them to your testimonials.
        </p>
      </div>

      {params.error === "limit" && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            <span className="font-semibold">Testimonial limit reached.</span>{" "}
            You&apos;ve hit the Free plan cap of 10 testimonials. Approve more by upgrading.
          </p>
          <Link
            href="/dashboard/settings/billing"
            className="mt-1 inline-block text-xs font-semibold text-destructive underline"
          >
            Upgrade to Pro →
          </Link>
        </div>
      )}

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

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {activeFilter === "NEW"
                ? "Inbox zero! No pending submissions to review."
                : `No ${activeFilter.toLowerCase()} submissions yet.`}
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/dashboard/collect">
                Get share links & embed code
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {s.customerName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{s.customerName}</p>
                    {s.customerEmail && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {s.customerEmail}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      via {s.form.name}
                    </Badge>
                  </div>

                  {s.rating && (
                    <div className="mt-1 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < s.rating!
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                  )}

                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {s.content || <em>No text content</em>}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <time className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </time>
                  {activeFilter === "NEW" && (
                    <div className="flex gap-1">
                      <form action={`/api/submissions/${s.id}/approve`} method="POST">
                        <Button
                          type="submit"
                          size="sm"
                          className="gap-1"
                          title="Approve and add to testimonials"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      </form>
                      <form action={`/api/submissions/${s.id}/reject`} method="POST">
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
