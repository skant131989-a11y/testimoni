import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Blog — Testimoni",
  description:
    "Guides, tips, and playbooks for collecting and displaying customer testimonials. Written for SaaS founders, coaches, and D2C brands.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Testimoni Blog — testimonial widget guides",
    description:
      "Guides and playbooks for collecting and displaying customer testimonials.",
    url: "/blog",
  },
};

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  dateISO: string;
  readMinutes: number;
}

const posts: Post[] = [
  {
    slug: "how-to-add-a-testimonial-widget",
    title: "How to add a testimonial widget to your website in 5 minutes",
    excerpt:
      "A step-by-step guide to collecting testimonials, curating a library, and embedding a wall of love on any site — from Framer and Webflow to WordPress and vanilla HTML.",
    date: "Aug 29, 2026",
    dateISO: "2026-08-29",
    readMinutes: 5,
  },
];

export default function BlogIndexPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <BookOpen className="h-3 w-3" />
              Blog
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Guides, tips, and playbooks
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Practical writing on collecting and displaying customer
              testimonials — for SaaS founders, coaches, and D2C brands.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <time dateTime={post.dateISO}>{post.date}</time>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readMinutes} min read
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">
                  {post.title}
                </h2>
                <p className="mt-3 text-muted-foreground">{post.excerpt}</p>
                <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
                  Read the guide <ArrowRight className="h-4 w-4" />
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-16 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Ready to collect testimonials?</h2>
            <p className="mt-2 text-muted-foreground">
              Free forever plan. Set up in 30 seconds. No credit card.
            </p>
            <TrackedLink
              cta="blog_index_signup"
              surface="blog_index"
              href="/signup"
              className="mt-6 inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </TrackedLink>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
