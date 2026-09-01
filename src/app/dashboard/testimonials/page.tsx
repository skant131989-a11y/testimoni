import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TestimonialStatus } from "@prisma/client";
import { TestimonialRow, type TestimonialRowData } from "./testimonial-row";

type FilterTab = "ALL" | TestimonialStatus;

interface TestimonialsPageProps {
  searchParams: Promise<{ filter?: string; q?: string }>;
}

export default async function TestimonialsPage({
  searchParams,
}: TestimonialsPageProps) {
  const params = await searchParams;
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
    redirect("/login");
  }

  const workspaceId = dbUser.workspaceMembers[0].workspaceId;
  const activeFilter: FilterTab =
    (params.filter?.toUpperCase() as FilterTab) || "ALL";
  const searchQuery = params.q || "";

  // Build where clause based on filters
  const whereClause: Parameters<typeof prisma.testimonial.findMany>[0] = {
    where: {
      workspaceId,
      ...(activeFilter !== "ALL" && { status: activeFilter as TestimonialStatus }),
      ...(searchQuery && {
        OR: [
          { customerName: { contains: searchQuery, mode: "insensitive" } },
          { content: { contains: searchQuery, mode: "insensitive" } },
          { customerEmail: { contains: searchQuery, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
  };

  const [testimonials, counts] = await Promise.all([
    prisma.testimonial.findMany(whereClause),
    prisma.testimonial.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: true,
    }),
  ]);

  const countMap: Record<string, number> = {};
  let totalCount = 0;
  for (const group of counts) {
    countMap[group.status] = group._count;
    totalCount += group._count;
  }

  const tabs: { label: string; value: FilterTab; count: number }[] = [
    { label: "All", value: "ALL", count: totalCount },
    { label: "Pending", value: "PENDING", count: countMap["PENDING"] ?? 0 },
    { label: "Approved", value: "APPROVED", count: countMap["APPROVED"] ?? 0 },
    { label: "Archived", value: "ARCHIVED", count: countMap["ARCHIVED"] ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Testimonials</h2>
          <p className="text-muted-foreground">
            Manage and organize your customer testimonials.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/import">
            <Plus className="mr-2 h-4 w-4" />
            Add Testimonial
          </Link>
        </Button>
      </div>

      {/* Search and filter tabs */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <form>
            <Input
              name="q"
              placeholder="Search testimonials..."
              defaultValue={searchQuery}
              className="pl-9"
            />
            {activeFilter !== "ALL" && (
              <input type="hidden" name="filter" value={activeFilter} />
            )}
          </form>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/dashboard/testimonials${tab.value !== "ALL" ? `?filter=${tab.value.toLowerCase()}` : ""}${searchQuery ? `${tab.value !== "ALL" ? "&" : "?"}q=${searchQuery}` : ""}`}
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
      </div>

      {/* Testimonials list */}
      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No testimonials match your search."
                : "No testimonials found. Start collecting feedback!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonials.map((testimonial) => {
            const row: TestimonialRowData = {
              id: testimonial.id,
              content: testimonial.content,
              rating: testimonial.rating,
              customerName: testimonial.customerName,
              customerTitle: testimonial.customerTitle,
              customerAvatar: testimonial.customerAvatar,
              videoUrl: testimonial.videoUrl,
              source: testimonial.source,
              status: testimonial.status,
              createdAt: testimonial.createdAt.toISOString(),
            };
            return <TestimonialRow key={testimonial.id} testimonial={row} />;
          })}
        </div>
      )}
    </div>
  );
}
