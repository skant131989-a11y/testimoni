import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/public-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { TrackedLink } from "@/components/tracked-link";
import { StructuredData } from "@/components/seo/structured-data";
import { pageBreadcrumbs } from "@/lib/seo-faqs";
import { COMPETITORS, FACTS_NOTE, TESTIMONI } from "@/lib/competitors";

const PATH = "/senja-alternatives";
const TITLE = "Senja alternatives: 6 testimonial tools compared";
const ANSWER =
  "The main Senja alternatives are Testimoni (free for 15 testimonials, then a flat $19/month), Famewall (from $12/month), Testimonial.to (from $25/month) and Shapo ($29/month). Senja's paid plans are $29 and $59 a month, so each of these costs less at the first paid tier or about the same. Trustmary (a review and feedback platform) and Vocal Video (built for video) are also options, but both cost more than Senja at their first paid tier.";

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
/** Alternatives that are not cheaper than Senja: kept out of the table above so the "costs less" claim stays true. */
const PRICIER = [COMPETITORS.trustmary, COMPETITORS["vocal-video"]];
const HOW_TO_CHOOSE = [
  "Stay with Senja if you want the broadest feature set and $29 to $59 a month is fine.",
  "Choose Testimoni if your praise already lives on X or LinkedIn and you want one flat price ($19/month after 15 free testimonials).",
  "Choose Famewall if the cheapest paid plan matters most ($12/month).",
  "Choose Testimonial.to if you want unlimited X and LinkedIn imports on the free plan, with surveys and monitoring on higher tiers.",
  "Choose Shapo if you want many widget styles, or Google reviews next to testimonials.",
  "Choose Trustmary if you need reviews, surveys and NPS or CSAT feedback in one platform and can budget for it.",
  "Choose Vocal Video if video testimonials are the main goal and you want them edited for you.",
];
const FAQS = [
  {
    question: "What are Senja alternatives with a free plan?",
    answer: `Testimoni (15 testimonials, flat $19/month after that), Famewall (10), Testimonial.to (10 text and 2 video) and Shapo (15) all have free plans, as do Trustmary (Solo: 5 survey responses and 200 widget views a month) and Vocal Video (5 published videos, with a watermark). Senja's own free plan allows 15 testimonials. Limits read from each pricing page (${FACTS_NOTE}).`,
  },
  {
    question: "What is the best free alternative to Senja?",
    answer: `Senja's free plan allows 15 testimonials. Testimoni (10), Famewall (10), Testimonial.to (10 text + 2 video), Shapo (15), Trustmary's Solo plan (5 survey responses and 200 widget views a month) and Vocal Video (5 published videos, with a watermark) all have free plans too; limits read from each pricing page (${FACTS_NOTE}).`,
  },
  {
    question: "Which Senja alternative is best for video testimonials?",
    answer:
      "Vocal Video is built around video: respondents record in their browser from a link and AI edits the footage, but its paid plans start at $99/month billed yearly. Testimonial.to's free plan includes 2 video testimonials. Testimoni collects short video through forms, and its Pro plan allows unlimited videos.",
  },
  {
    question: "Is Trustmary an alternative to Senja?",
    answer:
      "In part. Trustmary collects reviews, testimonials and survey feedback (including NPS and CSAT) and shows them in widgets, so it overlaps with Senja, but it is aimed at companies rather than solo founders: its free Solo plan is limited to 5 survey responses and 200 widget views a month, and its Starter plan is shown at $388/month billed annually.",
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
      <StructuredData faqs={FAQS} faqId={`https://testimoni.io${PATH}#faq`} breadcrumbs={pageBreadcrumbs(TITLE, PATH)} article={{ headline: TITLE, description: ANSWER, path: PATH, datePublished: "2026-10-28", dateModified: "2026-11-03" }} />
      <PublicNav />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{TITLE}</h1>
          <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-lg leading-relaxed">{ANSWER}</div>
          <p className="mt-3 text-xs text-muted-foreground">
            Disclosure: we make Testimoni. Prices and limits read from each tool&apos;s pricing page on {FACTS_NOTE};
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

          <h2 className="mt-12 border-l-4 border-primary pl-3 text-2xl font-bold">Also worth a look, but pricier than Senja</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {PRICIER.map((t) => (
              <div key={t.slug} className="rounded-2xl border bg-card p-6">
                <h3 className="text-xl font-bold">{t.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t.summary}</p>
                <p className="mt-3 text-sm">
                  <strong>Free plan:</strong> {t.freePlan}.
                </p>
                <p className="mt-2 text-sm">
                  <strong>Paid:</strong> {t.firstPaidLabel}.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Pick {t.name} if: {t.chooseIf.join("; ")}.</p>
                <p className="mt-3 text-sm">
                  <Link href={`/vs/${t.slug}`} className="text-primary underline">
                    Testimoni vs {t.name}
                  </Link>
                </p>
              </div>
            ))}
          </div>

          <h2 className="mt-12 border-l-4 border-primary pl-3 text-2xl font-bold">How to choose</h2>
          <ul className="mt-4 space-y-2 text-muted-foreground">
            {HOW_TO_CHOOSE.map((x) => (
              <li key={x}>• {x}</li>
            ))}
          </ul>

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
            <Link href="/vs/shapo" className="text-primary underline">vs Shapo</Link>,{" "}
            <Link href="/vs/trustmary" className="text-primary underline">vs Trustmary</Link>,{" "}
            <Link href="/vs/vocal-video" className="text-primary underline">vs Vocal Video</Link>, or the{" "}
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
      <SiteFooter />
    </div>
  );
}
