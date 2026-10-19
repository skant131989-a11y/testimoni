import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { TrackedLink } from "@/components/tracked-link";

const SLUG = "put-scattered-customer-praise-to-work";
const TITLE = "Your best customer praise is scattered across the internet. Here's how to put it to work.";
const DESCRIPTION =
  "Customers are already praising your product on X, LinkedIn, Reddit and app stores — and almost none of it is on your website. Here's how to turn it into a Wall of Love in minutes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/blog/${SLUG}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `/blog/${SLUG}`, type: "article" },
};

export default function ScatteredPraisePost() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <article className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              Playbook
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{TITLE}</h1>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> 5 min read
              </span>
              <span>·</span>
              <time dateTime="2026-10-19">Oct 19, 2026</time>
            </div>
          </div>

          <div className="prose prose-neutral mt-12 max-w-none dark:prose-invert">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Open your own X mentions, your LinkedIn notifications, your Product Hunt launch
              comments, your App Store reviews. Somewhere in there, real customers have already said
              real, specific, flattering things about your product. &ldquo;This saved me an
              afternoon.&rdquo; &ldquo;I switched from the other tool and haven&apos;t looked
              back.&rdquo; &ldquo;Finally, something that just works.&rdquo;
            </p>
            <p>
              Now open your website. How much of that is on it? For most small teams the honest answer
              is: almost none. The praise is <strong>scattered</strong>, <strong>buried in feeds</strong>,
              and <strong>owned by someone else&apos;s platform</strong>, while your landing page leans on
              generic copy like &ldquo;loved by teams everywhere.&rdquo; That gap is what Testimoni is
              built to close.
            </p>

            <h2 className="mt-10 text-2xl font-bold">The problem with the usual testimonial playbook</h2>
            <p>
              The standard advice is to email customers, ask for a testimonial, wait, chase, then copy
              the reply into a page. It works, but it has three problems:
            </p>
            <ol>
              <li>
                <strong>It&apos;s slow.</strong> You wait days for replies, and most customers never
                answer.
              </li>
              <li>
                <strong>It misses the praise you already have.</strong> The best quotes are often the
                ones people volunteered, in public, without being asked.
              </li>
              <li>
                <strong>It breaks easily.</strong> Screenshots go stale, quotes get retyped wrong, and
                the &ldquo;wall of love&rdquo; page quietly stops being updated.
              </li>
            </ol>

            <h2 className="mt-10 text-2xl font-bold">
              Step one: turn existing praise into a testimonial in about 30 seconds
            </h2>
            <p>
              Paste the URL of a tweet or LinkedIn post (or drop a screenshot of a DM or email) and it
              becomes an attributed testimonial in your library. Testimoni can also pull reviews in from
              the App Store, Google Play, the Chrome Web Store, Shopify and Product Hunt. You approve
              what goes public, so nothing shows up on your site that you haven&apos;t looked at.
            </p>

            <h2 className="mt-10 text-2xl font-bold">Step two: show it on your site with one line of code</h2>
            <p>
              Every workspace gets a hosted <strong>Wall of Love</strong> page you can link from your
              bio, plus a one-line embed for your own site. The embed uses Shadow DOM isolation, so it
              won&apos;t fight with your site&apos;s CSS, and there are five layouts: Grid, Masonry,
              Carousel, List and Marquee.
            </p>

            <h2 className="mt-10 text-2xl font-bold">Step three: keep collecting, without chasing</h2>
            <p>
              When you do want fresh testimonials, share a collection form as a link, embed, iframe,
              email template or QR code. Text, star ratings and video testimonials are supported, and
              everything lands in one inbox for one-click approval.
            </p>

            <h2 className="mt-10 text-2xl font-bold">Want to see what people are saying first?</h2>
            <p>
              The free{" "}
              <Link href="/tools/customer-voice" className="text-primary underline">
                Customer Voice scan
              </Link>{" "}
              searches X, Reddit and LinkedIn for public mentions of your site and sorts them into
              praise, complaints, feature requests, questions and competitor mentions. The scan is free;
              the Quick Scan unlocks every mention with sources for a one-time $9, and the Deep Report
              ($19) adds why customers choose you, your strongest social proof, competitors mentioned
              and a CSV export. It&apos;s a useful, slightly uncomfortable exercise even if you never
              become a customer: you see how your product is described when you&apos;re not in the room.
            </p>

            <h2 className="mt-10 text-2xl font-bold">What it costs</h2>
            <ul>
              <li>
                <strong>Free forever:</strong> 10 testimonials, 1 collection form, 1 widget, a hosted
                Wall of Love page and the one-line embed. No credit card.
              </li>
              <li>
                <strong>Pro, $19/month flat:</strong> unlimited testimonials, forms and widgets, all five
                layouts, video testimonials, custom branding and no watermark, plus the AI features: an
                &ldquo;Ask My Wall&rdquo; chatbot that answers visitor questions using only your real
                testimonials, a Wall Score that audits how strong your proof is, and one-click tweet
                drafts from any quote.
              </li>
            </ul>
            <p>One price, no per-seat fees, cancel any time.</p>

            <h2 className="mt-10 text-2xl font-bold">Who it&apos;s for</h2>
            <p>
              SaaS founders, indie hackers, coaches, agencies and small D2C brands: people who have real
              customers saying good things <em>somewhere</em> and no tidy way to show it. It&apos;s
              probably not for you if you need an enterprise review-management platform with approval
              chains and CRM integrations. It&apos;s deliberately focused on one job: getting real praise
              onto your site, fast.
            </p>

            <h2 className="mt-10 text-2xl font-bold">A simple way to try it today</h2>
            <ol>
              <li>Open your X mentions and pick the three nicest posts about your product.</li>
              <li>Paste each URL into Testimoni.</li>
              <li>Approve them, then embed the wall on your homepage or pricing page.</li>
            </ol>
            <p>
              That takes about ten minutes, and your page stops relying on claims and starts showing
              customers.
            </p>
          </div>

          <div className="mt-12 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Put your customers&apos; words on your site</h2>
            <p className="mt-2 text-muted-foreground">
              Free forever plan. Set up in 30 seconds. No credit card.
            </p>
            <TrackedLink
              cta="blog_scattered_praise_signup"
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
