import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";
import { StructuredData } from "@/components/seo/structured-data";
import { PageFAQ } from "@/components/seo/page-faq";
import { PAGE_FAQS } from "@/lib/seo-faqs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
const SLUG = "how-to-write-a-testimonial";

export const metadata: Metadata = {
  title: "How to write a testimonial (with examples and a template)",
  description:
    "How to write a testimonial that builds trust: what to include, a fill-in-the-blank template, and real-structure examples for SaaS, coaches, freelancers and stores. Plus how to get testimonials from customers.",
  alternates: { canonical: `/blog/${SLUG}` },
  openGraph: {
    title: "How to write a testimonial (with examples and a template)",
    description:
      "What makes a good testimonial, a simple template, examples, and how to ask customers for one.",
    url: `/blog/${SLUG}`,
  },
};

const EXAMPLES = [
  {
    label: "SaaS product",
    quote:
      "We used to spend Friday afternoons copying numbers between three tools. Now the report builds itself, and I get those hours back every week.",
    who: "Priya, Operations Lead",
  },
  {
    label: "Coach or consultant",
    quote:
      "I came in unsure how to price my services. Three sessions later I had a clear offer and signed my first client at double my old rate.",
    who: "Marcus, Freelance Designer",
  },
  {
    label: "Agency or service",
    quote:
      "They shipped the redesign two weeks early, and our sign-up rate went up the same month. Communication was clear the whole way through.",
    who: "Aditi, Founder",
  },
  {
    label: "Online store",
    quote:
      "I was nervous about ordering custom sizes online. It fit perfectly the first time, and support answered my questions within an hour.",
    who: "Daniel, Customer",
  },
];

export default function HowToWriteATestimonialPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData
        faqs={[...PAGE_FAQS.howToWriteTestimonial]}
        faqId={`${SITE_URL}/blog/${SLUG}#faq`}
        breadcrumbs={[
          { name: "Home", url: SITE_URL },
          { name: "Blog", url: `${SITE_URL}/blog` },
          { name: "How to write a testimonial", url: `${SITE_URL}/blog/${SLUG}` },
        ]}
      />
      <PublicNav />

      <main className="flex-1 py-16">
        <article className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              Guide
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              How to write a testimonial (with examples and a template)
            </h1>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> 6 min read
              </span>
              <span>·</span>
              <time dateTime="2026-09-23">Sep 23, 2026</time>
            </div>
          </div>

          <div className="prose prose-neutral mt-12 max-w-none dark:prose-invert">
            <p className="text-lg leading-relaxed text-muted-foreground">
              A <strong>testimonial</strong> is a customer&apos;s own statement about what it was like
              to use your product or service. The good ones are short, specific and believable. This
              guide shows what to include, gives you a fill-in-the-blank template, and walks through
              examples you can model — whether you&apos;re writing one for someone else or helping
              customers write theirs.
            </p>

            <div className="not-prose my-8 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
              <p className="text-sm font-bold">The short version</p>
              <p className="mt-2 text-sm text-muted-foreground">
                A good testimonial names a specific problem or result, sounds like a real person, is
                two or three sentences long, and comes with a name and role. &ldquo;Great product,
                highly recommend!&rdquo; is what to avoid.
              </p>
            </div>

            <h2 className="mt-10 text-2xl font-bold">What is a testimonial?</h2>
            <p>
              A testimonial is social proof that a business collects from a customer and shows on its
              own website or marketing. It differs from a review, which usually lives on a
              third-party platform where the business doesn&apos;t control the wording. Because you
              curate testimonials, you can choose the ones that speak most directly to what a new
              visitor is worried about.
            </p>

            <h2 className="mt-10 text-2xl font-bold">What makes a good testimonial</h2>
            <ol className="list-decimal space-y-2 pl-6">
              <li>
                <strong>A specific result.</strong> &ldquo;Saved me three hours a week&rdquo; beats
                &ldquo;really useful&rdquo;.
              </li>
              <li>
                <strong>A before and after.</strong> Name the problem they had, then what changed.
              </li>
              <li>
                <strong>A real name and role.</strong> A first name, job title or company makes it
                credible. Add a photo if the customer is happy to share one.
              </li>
              <li>
                <strong>One idea, two or three sentences.</strong> Long stories get skimmed.
              </li>
              <li>
                <strong>Their own words.</strong> Lightly trim for length, but keep the voice. Get
                their approval on any edit.
              </li>
            </ol>

            <h2 className="mt-10 text-2xl font-bold">A simple testimonial template</h2>
            <div className="not-prose rounded-xl border bg-card p-5 text-sm">
              <p className="italic">
                &ldquo;Before I used <strong>[product or service]</strong>, I <strong>[problem]</strong>.
                After <strong>[what they did]</strong>, <strong>[specific result]</strong>. I&apos;d
                recommend it to <strong>[who it&apos;s for]</strong>.&rdquo;
              </p>
              <p className="mt-3 text-muted-foreground">
                Fill it in with a real customer&apos;s details, then let them edit it until it sounds
                like them.
              </p>
            </div>

            <h2 className="mt-10 text-2xl font-bold">Testimonial examples</h2>
            <p>
              These examples are illustrative — written to show the structure, not quotes from real
              customers. Notice that each one names a concrete outcome and attributes it to a person.
            </p>
            <div className="not-prose mt-4 space-y-4">
              {EXAMPLES.map((e) => (
                <figure key={e.label} className="rounded-xl border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {e.label}
                  </p>
                  <blockquote className="mt-2 text-sm italic leading-relaxed">
                    &ldquo;{e.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-2 text-xs text-muted-foreground">— {e.who}</figcaption>
                </figure>
              ))}
            </div>

            <h2 className="mt-10 text-2xl font-bold">How to write a testimonial for someone else</h2>
            <p>
              If you&apos;re the one giving the testimonial — for a colleague, a freelancer or a
              vendor — the same rules apply. Say what you hired or worked with them for, what changed
              because of it, and one specific detail only someone who really worked with them would
              know. For a LinkedIn recommendation, our free{" "}
              <Link href="/tools/linkedin-recommendation">LinkedIn recommendation writer</Link> gives
              you a few versions to start from.
            </p>

            <h2 className="mt-10 text-2xl font-bold">How to get testimonials from customers</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Ask right after a good moment</strong> — a result, a thank-you message or a
                renewal.
              </li>
              <li>
                <strong>Make it one click.</strong> A single link to a short form beats a long email
                thread.
              </li>
              <li>
                <strong>Give prompts.</strong> Two or three questions (&ldquo;What problem were you
                trying to solve?&rdquo;) help people who freeze at a blank box. Our free{" "}
                <Link href="/tools/ask-templates">ask templates</Link> include ready-made wording.
              </li>
              <li>
                <strong>Look at what people already say.</strong> Customers often praise you publicly
                without being asked. The free{" "}
                <Link href="/tools/customer-voice">Customer Voice scan</Link> looks for those public
                mentions so you can ask permission to feature them.
              </li>
            </ul>

            <h2 className="mt-10 text-2xl font-bold">Common mistakes</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Vague praise with no result (&ldquo;Amazing service!&rdquo;).</li>
              <li>Long paragraphs nobody finishes.</li>
              <li>Anonymous quotes that read as invented.</li>
              <li>
                Making one up. A testimonial should come from a real customer, with their permission.
                Fake testimonials are misleading and can be illegal in many places.
              </li>
            </ul>
          </div>

          <div className="mt-16 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Draft yours in 30 seconds</h2>
            <p className="mt-2 text-muted-foreground">
              Type what happened, get three testimonial versions to choose from. Free, no signup.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <TrackedLink cta="blog_write_testimonial_writer" surface="blog_how_to_write" href="/tools/testimonial-writer">
                  Try the testimonial writer <ArrowRight className="ml-2 h-4 w-4" />
                </TrackedLink>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <TrackedLink cta="blog_write_widget" surface="blog_how_to_write" href="/testimonial-widget">
                  Show them on your site
                </TrackedLink>
              </Button>
            </div>
          </div>
        </article>
      </main>

      <PageFAQ
        heading="Writing testimonials: FAQ"
        subheading="Quick answers to the questions people ask most."
        faqs={PAGE_FAQS.howToWriteTestimonial}
      />

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
