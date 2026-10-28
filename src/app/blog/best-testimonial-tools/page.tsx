import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { StructuredData } from "@/components/seo/structured-data";
import { ALL_TOOLS, FACTS_VERIFIED_ON } from "@/lib/competitors";

const PATH = "/blog/best-testimonial-tools";
const TITLE = "The best testimonial tools in 2026, compared";
const ANSWER =
  "The best testimonial tool depends on what you need: Testimoni for turning praise that already exists on X, LinkedIn and screenshots into testimonials ($19/month Pro, free for 10); Senja and Testimonial.to for fuller collection platforms; Famewall for the lowest-priced paid plan; Shapo for many widget styles; Trustindex or EmbedSocial if you mainly want to show Google and other review-site reviews.";

export const metadata: Metadata = {
  title: TITLE,
  description: ANSWER,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: ANSWER, url: PATH, type: "article" },
};

const BEST_FOR: Record<string, string> = {
  testimoni: "Founders who already have praise on X, LinkedIn, Product Hunt or in screenshots",
  senja: "A fuller platform: forms, video, case studies, API",
  famewall: "Budget-conscious teams and multiple walls",
  "testimonial-to": "Video and text testimonials, with surveys and monitoring on higher tiers",
  shapo: "Many widget styles, including Google reviews widgets",
};

const FAQS = [
  {
    question: "What is the cheapest testimonial tool?",
    answer: `Several have free plans. Among the paid plans we checked on ${FACTS_VERIFIED_ON}, Famewall's Standard plan is the cheapest at $12/month; Testimoni's Pro is a flat $19/month for unlimited testimonials, Testimonial.to's Starter is $25/month, and Senja's Starter and Shapo's Pro are $29/month.`,
  },
  {
    question: "Which testimonial tool imports tweets?",
    answer:
      "Testimoni imports public X posts by URL, along with LinkedIn, Reddit, Hacker News and Product Hunt posts. Testimonial.to's free plan also includes unlimited X and LinkedIn imports, and Senja and Shapo import from many platforms on their plans.",
  },
  {
    question: "Which testimonial tool is best for solo founders?",
    answer:
      "Solo founders usually want a free plan that goes live fast and a low price when they outgrow it. Testimoni (free for 10 testimonials, then $19/month) and Famewall (free for 10, then $12/month) are the lowest-priced options we checked; Senja and Shapo give 15 free testimonials.",
  },
];

export default function BestTestimonialToolsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData
        faqs={FAQS}
        faqId={`https://testimoni.io${PATH}#faq`}
        article={{ headline: TITLE, description: ANSWER, path: PATH, datePublished: "2026-10-28", dateModified: "2026-10-28" }}
        breadcrumbs={[
          { name: "Home", url: "https://testimoni.io" },
          { name: "Blog", url: "https://testimoni.io/blog" },
          { name: TITLE, url: `https://testimoni.io${PATH}` },
        ]}
      />
      <PublicNav />

      <main className="flex-1 py-16">
        <article className="mx-auto max-w-4xl px-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <time dateTime="2026-10-28">Oct 28, 2026</time>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> 6 min read
            </span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{TITLE}</h1>

          <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-lg leading-relaxed">
            {ANSWER}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Disclosure: we make Testimoni, so weigh our own entry accordingly. Prices and limits for the other
            tools were read from their own pricing pages on {FACTS_VERIFIED_ON} — check their sites before you
            buy.
          </p>

          <h2 className="mt-12 border-l-4 border-primary pl-3 text-2xl font-bold">Quick comparison</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="p-3 text-left font-semibold">Tool</th>
                  <th className="p-3 text-left font-semibold">Best for</th>
                  <th className="p-3 text-left font-semibold">Free plan</th>
                  <th className="p-3 text-left font-semibold">First paid plan</th>
                </tr>
              </thead>
              <tbody>
                {ALL_TOOLS.map((t) => (
                  <tr key={t.slug} className={t.slug === "testimoni" ? "bg-primary/5" : ""}>
                    <td className="border-b p-3 align-top font-semibold">{t.name}</td>
                    <td className="border-b p-3 align-top">{BEST_FOR[t.slug]}</td>
                    <td className="border-b p-3 align-top">{t.freePlan}</td>
                    <td className="border-b p-3 align-top">{t.firstPaidLabel}</td>
                  </tr>
                ))}
                {["Trustindex", "EmbedSocial"].map((n) => (
                  <tr key={n}>
                    <td className="border-b p-3 align-top font-semibold">{n}</td>
                    <td className="border-b p-3 align-top">
                      Showing reviews from Google and other review sites on a website
                    </td>
                    <td className="border-b p-3 align-top">Check their site</td>
                    <td className="border-b p-3 align-top">Check their site</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="blogprose blogprose-neutral mt-10 max-w-none dark:blogprose-invert">
            {ALL_TOOLS.map((t) => (
              <section key={t.slug}>
                <h2 className="mt-10 text-2xl font-bold">{t.name}</h2>
                <p>{t.summary}</p>
                <p>
                  <strong>Free plan:</strong> {t.freePlan}. <strong>Paid:</strong> {t.firstPaidLabel}
                  {t.otherPaid ? `; ${t.otherPaid}` : ""}.
                </p>
                <ul>
                  {t.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p>
                  <strong>Pick {t.name} if:</strong> {t.chooseIf.join("; ")}.{" "}
                  {t.slug === "testimoni" ? (
                    <Link href="/pricing">See Testimoni pricing</Link>
                  ) : (
                    <>
                      <a href={t.pricingUrl} target="_blank" rel="noopener noreferrer">
                        {t.name} pricing
                      </a>
                      {["senja", "famewall", "shapo", "testimonial-to"].includes(t.slug) && (
                        <>
                          {" · "}
                          <Link href={t.slug === "senja" || t.slug === "testimonial-to" ? `/vs/${t.slug}` : `/vs/${t.slug}`}>
                            Testimoni vs {t.name}
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </p>
              </section>
            ))}

            <h2 className="mt-10 text-2xl font-bold">Trustindex and EmbedSocial</h2>
            <p>
              Both are strongest at showing reviews that already live on Google and other review platforms. Pick
              them if your social proof is mostly public reviews rather than customer quotes you collect or
              import. We haven&apos;t listed their prices here — check their sites.
            </p>

            <h2 className="mt-10 text-2xl font-bold">How to choose</h2>
            <ol>
              <li>
                <strong>Where is your praise today?</strong> On X and LinkedIn, pick a tool that imports by link.
                On Google reviews, pick a review widget.
              </li>
              <li>
                <strong>Do you need video?</strong> Check the video limits on each free plan — they differ a lot.
              </li>
              <li>
                <strong>What will it cost at your size?</strong> Compare the price for the number of testimonials
                you&apos;ll really have, not the headline plan.
              </li>
            </ol>

            <h2 className="mt-10 text-2xl font-bold">FAQ</h2>
            {FAQS.map((f) => (
              <div key={f.question}>
                <h3 className="mt-6 text-lg font-semibold">{f.question}</h3>
                <p>{f.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Try Testimoni free</h2>
            <p className="mt-2 text-muted-foreground">Free for 10 testimonials. Pro is a flat $19/month.</p>
            <TrackedLink
              cta="best_tools_signup"
              surface="blog_post"
              href="/signup"
              className="mt-6 inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </TrackedLink>
          </div>
        </article>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
