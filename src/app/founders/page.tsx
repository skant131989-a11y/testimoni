import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Users, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { LetterAvatar } from "@/components/letter-avatar";
import { StructuredData } from "@/components/seo/structured-data";
import { listFounderDirectory } from "@/lib/founder-directory";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

// Only visible workspaces reach this page (see listFounderDirectory).
// Cache the directory for 5 minutes — enough to keep it snappy while
// staying reasonably fresh as new founders sign up + opt in.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Founders on Testimoni — indie makers building in public",
  description:
    "Public directory of founders, creators, agencies, and D2C brands using Testimoni. Discover their walls of love, testify for each other, and get featured.",
  alternates: { canonical: "/founders" },
  openGraph: {
    title: "Founders on Testimoni",
    description:
      "The public founder directory. Every wall is real, testimonials are real, and you can testify for any of them.",
    url: "/founders",
  },
  robots: { index: true, follow: true },
};

const FAQS = [
  {
    question: "How do I get listed on the founders page?",
    answer:
      "Sign up for a free Testimoni workspace, then head to Settings → Public listing and toggle it on. Add a one-line pitch, your website, and X handle so other founders can find you. Nothing goes public until you opt in.",
  },
  {
    question: "Can I testify for another founder here?",
    answer:
      "Yes. Every founder's wall has a 'Testify for X' button — click it, write 2 sentences, and it lands on their wall pending their approval. Cross-founder endorsements build trust faster than customer reviews alone.",
  },
  {
    question: "How is the trending order calculated?",
    answer:
      "Trending combines total approved testimonials with recent activity (bonus weight for workspaces that added a testimonial in the last 7 days). Sort by 'newest' or 'most testimonials' with the toggles above the list.",
  },
  {
    question: "Do I need to be on Pro to be listed?",
    answer:
      "No. The founder directory works on every plan, including Free. Featured slots and the trending badge are also plan-independent — earned through activity, not payment.",
  },
];

export default async function FoundersPage() {
  const entries = await listFounderDirectory({ sort: "trending", limit: 60 });
  const totalFounders = entries.length;
  const totalTestimonials = entries.reduce((sum, e) => sum + e.approvedCount, 0);
  const [leader, ...rest] = entries;

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData
        faqs={FAQS}
        faqId={`${SITE_URL}/founders#faq`}
        breadcrumbs={[
          { name: "Home", url: SITE_URL },
          { name: "Founders", url: `${SITE_URL}/founders` },
        ]}
      />
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Users className="h-3 w-3" /> Public directory
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Founders on Testimoni
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Discover the walls of {totalFounders || "our"} founders, creators,
              agencies, and D2C brands. See real testimonials, testify for each
              other, and get featured.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <TrackedLink
                cta="founders_signup"
                surface="founders_directory"
                href="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Get your wall listed <ArrowRight className="h-4 w-4" />
              </TrackedLink>
              <span className="text-xs text-muted-foreground">
                Free forever · Toggle in settings
              </span>
            </div>

            {totalFounders > 0 && (
              <div className="mt-8 inline-flex items-center gap-6 rounded-lg border bg-muted/30 px-6 py-3 text-sm">
                <span>
                  <span className="text-lg font-bold text-foreground">
                    {totalFounders}
                  </span>{" "}
                  <span className="text-muted-foreground">public walls</span>
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>
                  <span className="text-lg font-bold text-foreground">
                    {totalTestimonials}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    approved testimonials
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Trending leaderboard — the top listing gets a distinct
              featured slot (larger card, "Trending #1" pill) so
              founders competing for the top spot see a real reward. */}
          {leader && (
            <section className="mt-12">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                <TrendingUp className="h-4 w-4" /> Trending this week
              </div>
              <FounderCardLarge entry={leader} rank={1} />
            </section>
          )}

          {rest.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Discover more
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((e, i) => (
                  <FounderCard key={e.slug} entry={e} rank={i + 2} />
                ))}
              </div>
            </section>
          )}

          {totalFounders === 0 && (
            <div className="mt-16 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-2xl font-bold">
                Be the first founder listed
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
                No public walls yet. Sign up, opt into the directory in
                Settings, and claim the #1 spot before anyone else does.
              </p>
              <TrackedLink
                cta="founders_empty_signup"
                surface="founders_directory"
                href="/signup"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Sign up free <ArrowRight className="h-4 w-4" />
              </TrackedLink>
            </div>
          )}

          {/* FAQ — same content Google sees in the FAQPage schema. */}
          <section className="mt-20 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">
              Directory FAQ
            </h2>
            <div className="mt-6 space-y-3">
              {FAQS.map((f) => (
                <details
                  key={f.question}
                  className="group rounded-lg border bg-card px-5 py-4"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold marker:hidden">
                    <span className="flex items-start justify-between gap-3">
                      <span>{f.question}</span>
                      <span className="mt-0.5 text-primary transition-transform group-open:rotate-180">
                        ⌄
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
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

function FounderCardLarge({
  entry,
  rank,
}: {
  entry: Awaited<ReturnType<typeof listFounderDirectory>>[number];
  rank: number;
}) {
  return (
    <Link
      href={`/founders/${entry.slug}`}
      className="group block rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {entry.logoUrl ? (
          <Image
            src={entry.logoUrl}
            alt={`${entry.name} logo`}
            width={72}
            height={72}
            className="h-18 w-18 shrink-0 rounded-2xl object-cover"
            unoptimized
          />
        ) : (
          <div className="shrink-0">
            <LetterAvatar name={entry.name} size={72} fontSize={28} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              #{rank} Trending
            </span>
            <span className="text-xs text-muted-foreground">
              {entry.approvedCount} testimonials
            </span>
          </div>
          <h3 className="mt-1.5 truncate text-2xl font-bold group-hover:text-primary">
            {entry.name}
          </h3>
          {entry.pitch && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {entry.pitch}
            </p>
          )}
        </div>
        <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary sm:block" />
      </div>
    </Link>
  );
}

function FounderCard({
  entry,
  rank,
}: {
  entry: Awaited<ReturnType<typeof listFounderDirectory>>[number];
  rank: number;
}) {
  return (
    <Link
      href={`/founders/${entry.slug}`}
      className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {entry.logoUrl ? (
          <Image
            src={entry.logoUrl}
            alt={`${entry.name} logo`}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-lg object-cover"
            unoptimized
          />
        ) : (
          <div className="shrink-0">
            <LetterAvatar name={entry.name} size={44} fontSize={18} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold group-hover:text-primary">
            {entry.name}
          </h3>
          <p className="text-[11px] text-muted-foreground">#{rank}</p>
        </div>
      </div>
      {entry.pitch && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
          {entry.pitch}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span>{entry.approvedCount} testimonials</span>
        <span className="font-medium text-primary group-hover:underline">
          View wall →
        </span>
      </div>
    </Link>
  );
}
