import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  Search,
  CheckCircle2,
  Archive,
  Trash2,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { TestimonialStatus, TestimonialSource } from "@prisma/client";

type FilterTab = "ALL" | TestimonialStatus;

interface TestimonialsPageProps {
  searchParams: Promise<{ filter?: string; q?: string }>;
}

const sourceColors: Record<TestimonialSource, string> = {
  MANUAL: "bg-gray-100 text-gray-700",
  FORM: "bg-blue-100 text-blue-700",
  TWITTER: "bg-sky-100 text-sky-700",
  LINKEDIN: "bg-indigo-100 text-indigo-700",
  GOOGLE: "bg-red-100 text-red-700",
  IMPORT: "bg-purple-100 text-purple-700",
};

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
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardContent className="flex items-start gap-4 p-4">
                {/* Avatar */}
                {testimonial.customerAvatar ? (
                  <img
                    src={testimonial.customerAvatar}
                    alt={testimonial.customerName}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {testimonial.customerName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {testimonial.customerName}
                    </p>
                    {testimonial.customerTitle && (
                      <span className="text-xs text-muted-foreground">
                        {testimonial.customerTitle}
                      </span>
                    )}
                    <Badge
                      className={cn(
                        "text-xs",
                        sourceColors[testimonial.source]
                      )}
                      variant="outline"
                    >
                      {testimonial.source.toLowerCase()}
                    </Badge>
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

                  {/* Rating */}
                  {testimonial.rating && (
                    <div className="mt-1 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < testimonial.rating!
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Content preview */}
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {testimonial.content || "No text content"}
                  </p>
                </div>

                {/* Actions and date */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <time className="text-xs text-muted-foreground">
                    {new Date(testimonial.createdAt).toLocaleDateString()}
                  </time>
                  <div className="flex gap-1">
                    {testimonial.status !== "APPROVED" && (
                      <form action={`/api/testimonials/${testimonial.id}/approve`} method="POST">
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Approve"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      </form>
                    )}
                    {testimonial.status !== "ARCHIVED" && (
                      <form action={`/api/testimonials/${testimonial.id}/archive`} method="POST">
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </form>
                    )}
                    <form action={`/api/testimonials/${testimonial.id}/delete`} method="POST">
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
