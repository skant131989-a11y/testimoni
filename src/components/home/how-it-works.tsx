import { ArrowRight, Wand2 } from "lucide-react";
import { TrackedLink } from "@/components/tracked-link";

/**
 * One section that says the whole job in three steps, in the same style as
 * the brand cards: a big step number, one short line, one small example.
 * Mock content is labelled as an example, never as a real customer.
 */
export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            From your customer&rsquo;s phone to your website.
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">Three steps. No chasing, no copy and paste.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {/* 1 */}
          <div className="flex flex-col rounded-3xl border border-violet-200 bg-card p-6 shadow-sm">
            <span className="text-6xl font-extrabold leading-none text-violet-200">1</span>
            <h3 className="mt-3 text-xl font-bold">They tap a link</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Or scan a QR poster. No account, no app. Not sure what to say? &ldquo;Help me say it&rdquo; turns a few
              rough words into a clear review.
            </p>
            <div className="mt-5 rounded-2xl bg-violet-50 p-4 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Example</p>
              <p className="mt-1.5 text-muted-foreground">fast delivery, friendly staff, good price</p>
              <p className="mt-2 inline-flex items-center gap-1.5 font-medium text-primary">
                <Wand2 className="h-3.5 w-3.5" /> Help me say it
              </p>
            </div>
          </div>

          {/* 2 */}
          <div className="flex flex-col rounded-3xl border border-violet-200 bg-card p-6 shadow-sm">
            <span className="text-6xl font-extrabold leading-none text-violet-200">2</span>
            <h3 className="mt-3 text-xl font-bold">You approve in one tap</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              A live alert in your dashboard, or approve straight from the email. Nothing sits unseen, and we remind
              you if it does.
            </p>
            <div className="mt-5 rounded-2xl bg-violet-100/70 p-4 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Example alert</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-medium">New testimonial · 5 stars</span>
                <span className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Approve
                </span>
              </div>
            </div>
          </div>

          {/* 3 */}
          <div className="flex flex-col rounded-3xl border border-violet-200 bg-card p-6 shadow-sm">
            <span className="text-6xl font-extrabold leading-none text-violet-200">3</span>
            <h3 className="mt-3 text-xl font-bold">It shows on your site</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              A hosted Wall of Love, or one line of code on Webflow, Framer, WordPress or Shopify. It updates itself.
            </p>
            <div className="mt-5 rounded-2xl bg-slate-900 p-4 font-mono text-xs text-violet-200">
              &lt;script src=&quot;…/widget.js&quot;&gt;
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl bg-gradient-to-br from-violet-900 via-violet-800 to-violet-600 p-6 text-white shadow-xl shadow-violet-900/20 md:flex-row md:items-center md:p-8">
          <p className="max-w-md text-2xl font-bold leading-tight">
            See what people already say about you. Free, 20 seconds.
          </p>
          <TrackedLink
            cta="how_find_praise"
            surface="home"
            href="#find-praise"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-violet-900 transition hover:bg-violet-50"
          >
            Find my praise <ArrowRight className="h-4 w-4" />
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
