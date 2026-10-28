import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { StructuredData } from "@/components/seo/structured-data";
import { pageBreadcrumbs } from "@/lib/seo-faqs";
import { COMPETITORS, FACTS_VERIFIED_ON, TESTIMONI } from "@/lib/competitors";

const PATH = "/senja-alternatives";
const TITLE = "Senja alternatives: 4 testimonial tools compared";
const ANSWER =
  "The main Senja alternatives are Testimoni (free for 10 testimonials, then a flat $19/month), Famewall (from $12/month), Testimonial.to (from $25/month) and Shapo ($29/month). Senja's paid plans are $29 and $59 a month, so each of these costs less at the first paid tier or about the same.";

export const metadata: Metadata = {
  title: TITLE,
  description: ANSWER,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: ANSWER, url: PATH },
};

const ALTERNATIVES = [TESTIMONI, COMPETITORS.famewall, COMPETITORS["testimonial-to"], COMPETITORS.shapo];
const WHY: Record<string, string> = {
  testimoni: "Import praise from X and LinkedIn by link; one flat price; free hosted Wall of Love",
  famewall: "Lowest-priced paid plan; several walls and collection pages",
  "testimonial-to": "Free unlimited X and LinkedIn imports; surveys and monitoring on higher tiers",
  shapo: "15 free testimonials; many widget styles including Google reviews",
};
const FAQS = [
  {
    question: "What is the best free alternative to Senja?",
    answer: `Senja's free plan allows 15 testimonials. Testimoni (10), Famewall (10), Testimonial.to (10 text + 2 video) and Shapo (15) all have free plans too; limits read from each pricing page on ${FACTS_VERIFIED_ON}.`,
  },
  {
    question: "Is there a cheaper alternative to Senja?",
    answer:
      "Yes. Senja's paid plans are $29 and $59 a month. Testimoni Pro is a flat $19/month, Famewall's Standard plan is $12/month and Testimonial.to's Starter is $25/month.",
  },
];

export default function SenjaAlternativesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData faqs={FAQS} faqId={`https://testimoni.io${PATH}#faq`} breadcrumbs={pageBreadcrumbs(TITLE, PATH)} article={{ headline: TITLE, description: ANSWER, path: PATH, datePublished: "2026-10-28", dateModified: "2026-10-28" }} />
      <PublicNav />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{TITLE}</h1>
          <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-lg leading-relaxed">{ANSWER}</div>
          <p className="mt-3 text-xs text-muted-foreground">
            Disclosure: we make Testimoni. Prices and limits read from each tool&apos;s pricing page on {FACTS_VERIFIED_ON};
            check their sites before you buy.
          </p>

          <div className="mt-10 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="p-3 text-left font-semibold">Tool</th>
                  <th className="p-3 text-left font-semibold">Free plan</th>
                  <th className="p-3 text-left font-semibold">First paid plan</th>
                  <th className="p-3 text-left font-semibold">Why pick it</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b p-3 align-top font-semibold">Senja (for reference)</td>
                  <td className="border-b p-3 align-top">{COMPETITORS.senja.freePlan}</td>
                  <td className="border-b p-3 align-top">
                    {COMPETITORS.senja.firstPaidLabel}; {COMPETITORS.senja.otherPaid}
                  </td>
                  <td className="border-b p-3 align-top">The broadest feature set</td>
                </tr>
                {ALTERNATIVES.map((t) => (
                  <tr key={t.slug} className={t.slug === "testimoni" ? "bg-primary/5" : ""}>
                    <td className="border-b p-3 align-top font-semibold">{t.name}</td>
                    <td className="border-b p-3 align-top">{t.freePlan}</td>
                    <td className="border-b p-3 align-top">{t.firstPaidLabel}</td>
                    <td className="border-b p-3 align-top">{WHY[t.slug]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-12 border-l-4 border-primary pl-3 text-2xl font-bold">FAQ</h2>
          <div className="mt-4 space-y-5">
            {FAQS.map((f) => (
              <div key={f.question}>
                <h3 className="text-lg font-semibold">{f.question}</h3>
                <p className="mt-1 text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm">
            Detailed comparisons: <Link href="/vs/senja" className="text-primary underline">Testimoni vs Senja</Link>,{" "}
            <Link href="/vs/famewall" className="text-primary underline">vs Famewall</Link>,{" "}
            <Link href="/vs/testimonial-to" className="text-primary underline">vs Testimonial.to</Link>,{" "}
            <Link href="/vs/shapo" className="text-primary underline">vs Shapo</Link>, or the{" "}
            <Link href="/blog/best-testimonial-tools" className="text-primary underline">full tools roundup</Link>.
          </p>
          <TrackedLink
            cta="senja_alternatives_signup"
            surface="alternatives"
            href="/signup"
            className="mt-6 inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Testimoni free
          </TrackedLink>
        </div>
      </main>
    </div>
  );
}
