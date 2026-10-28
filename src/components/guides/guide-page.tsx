import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { StructuredData } from "@/components/seo/structured-data";
import { pageBreadcrumbs } from "@/lib/seo-faqs";
import { GUIDES, GUIDE_LINKS, type Guide } from "@/lib/guides";

const SITE_URL = "https://testimoni.io";

export function guideMetadata(slug: string): Metadata {
  const g = GUIDES.find((x) => x.slug === slug)!;
  return {
    title: g.title,
    description: g.answer,
    alternates: { canonical: g.path },
    openGraph: { title: g.title, description: g.answer, url: g.path, type: "article" },
  };
}

export function GuidePage({ slug }: { slug: string }) {
  const g: Guide = GUIDES.find((x) => x.slug === slug)!;
  const related = g.related
    .map((href) => GUIDE_LINKS.find((l) => l.href === href) ?? { href, label: href })
    .filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData
        faqs={g.faqs}
        faqId={`${SITE_URL}${g.path}#faq`}
        breadcrumbs={pageBreadcrumbs(g.title, g.path)}
        article={{ headline: g.title, description: g.answer, path: g.path, datePublished: "2026-10-28", dateModified: "2026-10-28" }}
      />
      <PublicNav />

      <main className="flex-1 py-16">
        <article className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{g.title}</h1>

          <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-lg leading-relaxed">
            {g.answer}
          </div>

          <div className="blogprose blogprose-neutral mt-10 max-w-none dark:blogprose-invert">
            {g.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="mt-10 text-2xl font-bold">{s.heading}</h2>
                {s.paragraphs?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {s.steps && (
                  <ol>
                    {s.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                )}
                {s.bullets && (
                  <ul>
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
                {s.table && (
                  <div className="not-blogprose mt-4 overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/40">
                        <tr>
                          {s.table.headers.map((h) => (
                            <th key={h} className="p-3 text-left font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.table.rows.map((row) => (
                          <tr key={row[0]} className={row[0] === "Testimoni" ? "bg-primary/5" : ""}>
                            {row.map((cell, i) => (
                              <td key={i} className={`border-b p-3 align-top ${i === 0 ? "font-semibold" : ""}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {s.table.note && <p className="p-3 text-xs text-muted-foreground">{s.table.note}</p>}
                  </div>
                )}
              </section>
            ))}

            <h2 className="mt-10 text-2xl font-bold">FAQ</h2>
            {g.faqs.map((f) => (
              <div key={f.question}>
                <h3 className="mt-6 text-lg font-semibold">{f.question}</h3>
                <p>{f.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Try it free</h2>
            <p className="mt-2 text-muted-foreground">
              Free for 10 testimonials. Pro is a flat $19/month. No credit card to start.
            </p>
            <TrackedLink
              cta={`guide_${g.slug}_signup`}
              surface="guide"
              href="/signup"
              className="mt-6 inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </TrackedLink>
          </div>

          <div className="mt-12 rounded-2xl border p-6">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Related
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {related.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-primary hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/pricing" className="text-primary hover:underline">
                  Testimoni pricing
                </Link>
              </li>
            </ul>
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
