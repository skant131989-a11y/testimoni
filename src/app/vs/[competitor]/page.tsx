import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { StructuredData } from "@/components/seo/structured-data";
import { vsBreadcrumbs } from "@/lib/seo-faqs";
import { COMPETITORS, FACTS_VERIFIED_ON, TESTIMONI } from "@/lib/competitors";

/**
 * Data-driven comparison pages. /vs/senja and /vs/testimonial-to keep
 * their own hand-written pages (static routes win over this dynamic
 * one); this covers the rest of the competitors in lib/competitors.ts.
 */
const SLUGS = ["famewall", "shapo"] as const;

export function generateStaticParams() {
  return SLUGS.map((competitor) => ({ competitor }));
}
export const dynamicParams = false;

function content(slug: string) {
  const c = COMPETITORS[slug];
  if (!c || !SLUGS.includes(slug as (typeof SLUGS)[number])) return null;
  const cheaper = c.firstPaidUsd < TESTIMONI.firstPaidUsd;
  const answer = cheaper
    ? `Testimoni and ${c.name} both have free plans. ${c.name}'s first paid plan is cheaper (${c.firstPaidLabel} vs Testimoni Pro at $19/month flat). Testimoni is built around importing praise that already exists on X and LinkedIn by link, with one flat plan; choose ${c.name} if its lower entry price and its plan limits suit you.`
    : `Testimoni and ${c.name} both have free plans. Testimoni's Pro is $19/month flat vs ${c.firstPaidLabel} at ${c.name}. Testimoni is built around importing praise that already exists on X and LinkedIn by link, with one flat plan and no tiers.`;
  const faqs = [
    {
      question: `Is Testimoni cheaper than ${c.name}?`,
      answer: cheaper
        ? `Not at the first paid tier: ${c.name}'s ${c.firstPaidLabel} is below Testimoni Pro's $19/month. Testimoni has a single flat paid plan with unlimited testimonials, all five layouts and no watermark. Prices read from ${c.name}'s site on ${FACTS_VERIFIED_ON}.`
        : `At the first paid tier, yes: Testimoni Pro is $19/month vs ${c.firstPaidLabel} at ${c.name}. Prices read from ${c.name}'s site on ${FACTS_VERIFIED_ON}.`,
    },
    {
      question: `What does ${c.name}'s free plan include?`,
      answer: `${c.freePlan}. Testimoni's free plan: ${TESTIMONI.freePlan}.`,
    },
    {
      question: `Can I import tweets with Testimoni and ${c.name}?`,
      answer: `Testimoni imports public X posts by URL (and LinkedIn, Reddit, Hacker News and Product Hunt posts). For ${c.name}'s import options, check ${c.url.replace("https://", "")}.`,
    },
  ];
  return { c, answer, faqs };
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params;
  const d = content(competitor);
  if (!d) return {};
  const title = `Testimoni vs ${d.c.name}: pricing and features compared`;
  return {
    title,
    description: d.answer,
    alternates: { canonical: `/vs/${competitor}` },
    openGraph: { title, description: d.answer, url: `/vs/${competitor}` },
  };
}

export default async function VsPage({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params;
  const d = content(competitor);
  if (!d) notFound();
  const { c, answer, faqs } = d;

  const rows: [string, string, string][] = [
    ["Free plan", TESTIMONI.freePlan, c.freePlan],
    ["First paid plan", TESTIMONI.firstPaidLabel, c.firstPaidLabel],
    ["Other paid plans", TESTIMONI.otherPaid, c.otherPaid],
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData
        faqs={faqs}
        faqId={`https://testimoni.io/vs/${competitor}#faq`}
        breadcrumbs={vsBreadcrumbs(c.name, competitor)}
        article={{ headline: `Testimoni vs ${c.name}: pricing and features compared`, description: answer, path: `/vs/${competitor}`, datePublished: "2026-10-28", dateModified: "2026-10-28" }}
      />
      <PublicNav />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Testimoni vs {c.name}</h1>
          <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-lg leading-relaxed">
            {answer}
          </div>

          <h2 className="mt-12 border-l-4 border-primary pl-3 text-2xl font-bold">Side by side</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="p-3 text-left font-semibold" />
                  <th className="p-3 text-left font-semibold text-primary">Testimoni</th>
                  <th className="p-3 text-left font-semibold">{c.name}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, a, b]) => (
                  <tr key={label}>
                    <td className="border-b p-3 align-top font-semibold">{label}</td>
                    <td className="border-b bg-primary/5 p-3 align-top">{a}</td>
                    <td className="border-b p-3 align-top">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="p-3 text-xs text-muted-foreground">
              {c.name} details read from{" "}
              <a href={c.pricingUrl} target="_blank" rel="noopener noreferrer" className="underline">
                {c.pricingUrl.replace("https://", "")}
              </a>{" "}
              on {FACTS_VERIFIED_ON}. Plans change — check their site.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
              <h2 className="text-xl font-bold">Pick Testimoni if…</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {TESTIMONI.chooseIf.map((x) => (
                  <li key={x}>• {x}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="text-xl font-bold">Pick {c.name} if…</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {c.chooseIf.map((x) => (
                  <li key={x}>• {x}</li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className="mt-12 border-l-4 border-primary pl-3 text-2xl font-bold">FAQ</h2>
          <div className="mt-4 space-y-5">
            {faqs.map((f) => (
              <div key={f.question}>
                <h3 className="text-lg font-semibold">{f.question}</h3>
                <p className="mt-1 text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Try Testimoni free</h2>
            <TrackedLink
              cta={`vs_${competitor}_signup`}
              surface="vs"
              href="/signup"
              className="mt-4 inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </TrackedLink>
            <p className="mt-4 text-sm">
              <Link href="/blog/best-testimonial-tools" className="text-primary underline">
                See all the testimonial tools compared
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
