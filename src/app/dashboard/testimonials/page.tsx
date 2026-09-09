import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TestimonialStatus } from "@prisma/client";
import { FilterTabs } from "./filter-tabs";
import { BulkApproveBar } from "./bulk-approve-bar";
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

  const [testimonials, counts, ratingBuckets] = await Promise.all([
    prisma.testimonial.findMany(whereClause),
    prisma.testimonial.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: true,
    }),
    // Rating buckets for the pending tab's bulk-approve filter.
    // Cheap groupBy scoped to PENDING so the dropdown labels are
    // accurate ("Approve 87 5-star" etc.).
    prisma.testimonial.groupBy({
      by: ["rating"],
      where: { workspaceId, status: "PENDING" },
      _count: true,
    }),
  ]);

  // Fold rating buckets into cumulative counts the bulk bar can show.
  const bulkCounts = {
    fiveStar: 0,
    fourStarPlus: 0,
    threeStarPlus: 0,
  };
  for (const b of ratingBuckets) {
    const r = b.rating ?? 0;
    if (r >= 5) bulkCounts.fiveStar += b._count;
    if (r >= 4) bulkCounts.fourStarPlus += b._count;
    if (r >= 3) bulkCounts.threeStarPlus += b._count;
  }

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

        {/* Filter tabs — client-side transitions + top progress bar
            so users get instant feedback on click and see a loader
            while the server re-fetches counts + rows. */}
        <FilterTabs tabs={tabs} activeFilter={activeFilter} searchQuery={searchQuery} />
      </div>

      {/* Bulk-approve bar — only shown on the Pending tab. Cleanest
          way to blast through a large synced review backlog with
          one click (optionally rating-filtered). */}
      {activeFilter === "PENDING" && (countMap["PENDING"] ?? 0) >= 2 && (
        <BulkApproveBar
          totalPending={countMap["PENDING"] ?? 0}
          counts={bulkCounts}
        />
      )}

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
