import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Star, ArrowRight, Sparkles } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { LetterAvatar } from "@/components/letter-avatar";
import { StructuredData } from "@/components/seo/structured-data";
import { listTopTestimonialsAcrossWorkspaces } from "@/lib/founder-directory";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

// Cache for 10 minutes — this is the top-testimonials-across-all-
// workspaces page; freshness matters less than DB load protection.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Wall of Walls — real testimonials from real founders",
  description:
    "The best testimonials collected across every public workspace on Testimoni. Real quotes from real customers, hand-curated from the most active founder walls.",
  alternates: { canonical: "/wall" },
  openGraph: {
    title: "Wall of Walls — the best of Testimoni",
    description:
      "Real testimonials from real founders. Rotates weekly. Get featured by joining the public directory.",
    url: "/wall",
  },
  robots: { index: true, follow: true },
};

const FAQS = [
  {
    question: "What is the Wall of Walls?",
    answer:
      "A curated selection of the best testimonials collected across every public workspace on Testimoni. It's our own Wall of Love — but for the entire community, not one product.",
  },
  {
    question: "How do I get featured?",
    answer:
      "Sign up, opt into the public directory in Settings, and collect testimonials. The most recent, highest-quality ones bubble up automatically. No hand-curation, no pay-to-play.",
  },
  {
    question: "Are these real testimonials?",
    answer:
      "Yes. Every quote here is a real testimonial approved by a real workspace owner. Clicking any card takes you to the founder's full wall where you can see more.",
  },
];

export default async function WallOfWallsPage() {
  const testimonials = await listTopTestimonialsAcrossWorkspaces({ limit: 60 });
  const totalWalls = new Set(testimonials.map((t) => t.workspace.slug)).size;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-50/60 via-background to-background">
      <StructuredData
        faqs={FAQS}
        faqId={`${SITE_URL}/wall#faq`}
        breadcrumbs={[
          { name: "Home", url: SITE_URL },
          { name: "Wall of Walls", url: `${SITE_URL}/wall` },
        ]}
      />
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3 text-primary" /> Curated across all
              walls
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Wall of Walls
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Real testimonials from real founders on Testimoni. Every quote
              here is approved by the workspace it lives on — click any card
              to see more from that founder.
            </p>
          </div>

          {testimonials.length > 0 ? (
            <>
              <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((t) => {
                  const wallId = t.workspace.widgets[0]?.id;
                  const wallUrl = wallId
                    ? `/w/${wallId}`
                    : `/founders/${t.workspace.slug}`;
                  return (
                    <Link
                      key={t.id}
                      href={wallUrl}
                      className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      {t.rating && (
                        <div className="flex gap-0.5">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      )}
                      <p className="mt-3 text-sm leading-relaxed text-foreground line-clamp-6">
                        &ldquo;{t.content}&rdquo;
                      </p>
                      <div className="mt-4 flex items-center gap-2 border-t pt-3">
                        {t.customerAvatar ? (
                          <Image
                            src={t.customerAvatar}
                            alt={t.customerName}
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <LetterAvatar
                            name={t.customerName}
                            size={28}
                            fontSize={11}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">
                            {t.customerName}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            on {t.workspace.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {testimonials.length} testimonials across {totalWalls} walls
              </div>
            </>
          ) : (
            <div className="mt-16 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-2xl font-bold">
                Nothing here yet — be the first
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
                No public testimonials yet. Sign up, opt into the public
                directory, and yours will be the first quotes on this page.
              </p>
              <TrackedLink
                cta="wall_of_walls_empty_signup"
                surface="wall_of_walls"
                href="/signup"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Sign up free <ArrowRight className="h-4 w-4" />
              </TrackedLink>
            </div>
          )}

          <section className="mt-20 rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Get featured here</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Collect a testimonial (paste a tweet, share a form) then opt
              into the public directory in Settings. The most recent
              high-quality ones rotate onto this page automatically.
            </p>
            <TrackedLink
              cta="wall_of_walls_cta"
              surface="wall_of_walls"
              href="/signup"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get your wall live <ArrowRight className="h-4 w-4" />
            </TrackedLink>
          </section>
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
