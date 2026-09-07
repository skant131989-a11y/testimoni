import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Globe,
  Sparkles,
  Twitter,
  Star,
} from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { LetterAvatar } from "@/components/letter-avatar";
import { StructuredData } from "@/components/seo/structured-data";
import { getFounderProfile } from "@/lib/founder-directory";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

// Cache profile pages briefly — long enough to reduce DB load,
// short enough that new testimonials show up quickly after approval.
export const revalidate = 180;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getFounderProfile(slug);
  if (!profile) {
    return { title: "Founder not found", robots: { index: false, follow: false } };
  }
  const title = `${profile.name} — ${profile.approvedCount} testimonials`;
  const description =
    profile.pitch ||
    `${profile.name} is on Testimoni with ${profile.approvedCount} public testimonials. See their wall of love, testify for them, or start your own.`;
  return {
    title,
    description,
    alternates: { canonical: `/founders/${profile.slug}` },
    openGraph: {
      title,
      description,
      url: `/founders/${profile.slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function FounderProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getFounderProfile(slug);
  if (!profile) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData
        faqId={`${SITE_URL}/founders/${profile.slug}#faq`}
        breadcrumbs={[
          { name: "Home", url: SITE_URL },
          { name: "Founders", url: `${SITE_URL}/founders` },
          {
            name: profile.name,
            url: `${SITE_URL}/founders/${profile.slug}`,
          },
        ]}
      />
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <Link
            href="/founders"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to directory
          </Link>

          <header className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {profile.logoUrl ? (
                <Image
                  src={profile.logoUrl}
                  alt={`${profile.name} logo`}
                  width={96}
                  height={96}
                  className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                  unoptimized
                />
              ) : (
                <div className="shrink-0">
                  <LetterAvatar name={profile.name} size={96} fontSize={36} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold md:text-4xl">
                  {profile.name}
                </h1>
                {profile.pitch && (
                  <p className="mt-2 text-base text-muted-foreground md:text-lg">
                    {profile.pitch}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {profile.approvedCount} testimonials
                  </span>
                  {profile.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 hover:text-primary"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                  {profile.xHandle && (
                    <a
                      href={`https://x.com/${profile.xHandle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 hover:text-primary"
                    >
                      <Twitter className="h-3.5 w-3.5" />@
                      {profile.xHandle.replace(/^@/, "")}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={profile.wallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                See full wall <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={`${profile.wallUrl}#testify`}
                className="inline-flex items-center gap-2 rounded-md border-2 border-primary/40 bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                Testify for {profile.name.split(" ")[0]}
              </a>
            </div>
          </header>

          {profile.testimonials.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold tracking-tight">
                Recent testimonials
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {profile.testimonials.map((t) => (
                  <article
                    key={t.id}
                    className="rounded-xl border bg-card p-5"
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
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
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
                        {t.customerTitle && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {t.customerTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="mt-16 rounded-2xl border-2 border-primary/30 bg-primary/5 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                Want your own founder page?
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
                Sign up for a free Testimoni workspace, opt into the public
                directory in Settings, and get a page like this one.
              </p>
              <TrackedLink
                cta="founder_profile_signup"
                surface={`founders_${profile.slug}`}
                href="/signup"
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Sign up free <ArrowRight className="h-4 w-4" />
              </TrackedLink>
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
