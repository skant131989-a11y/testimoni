import { ArrowRight, ImagePlus, Link2, Mail, MessageCircle, QrCode, Search, Send, Upload } from "lucide-react";
import { TrackedLink } from "@/components/tracked-link";

/**
 * "Three ways to get testimonials", in the same card style as How it works:
 * a small labelled example on top, one line, three short points, one link.
 * Mock content is labelled as an example, never as a real customer.
 */
export function ThreeWays() {
  return (
    <section className="border-y bg-muted/30 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Get testimonials</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Three ways to fill your wall.</h2>
          <p className="mt-3 text-lg text-muted-foreground">Use one or all three. You approve every one.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {/* Ask */}
          <div className="flex flex-col rounded-3xl border border-violet-200 bg-card p-6 shadow-sm">
            <TrackedLink cta="ways_0_card" surface="home" href="/signup?src=home_ways_ask" className="block min-h-[8.5rem] rounded-2xl bg-violet-50 p-4 transition hover:brightness-95">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Send it anywhere</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                {[
                  { Icon: Link2, t: "Link" },
                  { Icon: Mail, t: "Email" },
                  { Icon: MessageCircle, t: "WhatsApp" },
                  { Icon: Send, t: "DM" },
                  { Icon: QrCode, t: "QR poster" },
                ].map(({ Icon, t }) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" /> {t}
                  </span>
                ))}
              </div>
            </TrackedLink>
            <h3 className="mt-5 text-xl font-bold">
              <TrackedLink cta="ways_0_title" surface="home" href="/signup?src=home_ways_ask" className="hover:text-primary">
                Ask your customers
              </TrackedLink>
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              One link that works everywhere. They answer on their phone in under a minute.
            </p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted-foreground">
              <li>Print-ready QR poster for your counter or packaging</li>
              <li>Or embed the form on your own site</li>
              <li>Approve each one from your inbox</li>
            </ul>
            <TrackedLink
              cta="ways_0"
              surface="home"
              href="/signup?src=home_ways_ask"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Create a collection form <ArrowRight className="h-4 w-4" />
            </TrackedLink>
          </div>

          {/* Find */}
          <div className="flex flex-col rounded-3xl border border-violet-200 bg-card p-6 shadow-sm">
            <TrackedLink cta="ways_1_card" surface="home" href="#find-praise" className="block min-h-[8.5rem] rounded-2xl bg-violet-100/70 p-4 transition hover:brightness-95">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Example result</p>
              <div className="mt-2 rounded-xl border border-violet-200 bg-white p-3 text-sm">
                <p className="text-muted-foreground">&ldquo;Switched last month and never looked back.&rdquo;</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Search className="h-3.5 w-3.5" /> Found on X · link kept
                </p>
              </div>
            </TrackedLink>
            <h3 className="mt-5 text-xl font-bold">
              <TrackedLink cta="ways_1_title" surface="home" href="#find-praise" className="hover:text-primary">
                Find what&rsquo;s already out there
              </TrackedLink>
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Paste your website. We search X, LinkedIn, Reddit, Product Hunt and app stores for real posts about you.
            </p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted-foreground">
              <li>Every quote keeps its author and source link</li>
              <li>Free to try, no signup</li>
              <li>Pro re-scans weekly and emails new praise</li>
            </ul>
            <TrackedLink
              cta="ways_1"
              surface="home"
              href="#find-praise"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Find my praise <ArrowRight className="h-4 w-4" />
            </TrackedLink>
          </div>

          {/* Add */}
          <div className="flex flex-col rounded-3xl border border-violet-200 bg-card p-6 shadow-sm">
            <TrackedLink cta="ways_2_card" surface="home" href="#try" className="block min-h-[8.5rem] rounded-2xl bg-violet-50 p-4 transition hover:brightness-95">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Paste or drop</p>
              <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-dashed border-violet-300 bg-white px-4 py-3 text-sm text-muted-foreground">
                <ImagePlus className="h-5 w-5 shrink-0 text-primary" />
                <span>A link, or a screenshot of a DM</span>
              </div>
            </TrackedLink>
            <h3 className="mt-5 text-xl font-bold">
              <TrackedLink cta="ways_2_title" surface="home" href="#try" className="hover:text-primary">
                Add what you already have
              </TrackedLink>
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Paste a link, drop a screenshot, or pull in store reviews.
            </p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted-foreground">
              <li>Tweets, LinkedIn posts, Reddit comments and any public URL</li>
              <li>AI reads screenshots of DMs, emails and reviews</li>
              <li>App Store, Google Play, Chrome Web Store and Product Hunt reviews</li>
            </ul>
            <TrackedLink
              cta="ways_2"
              surface="home"
              href="#try"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Upload className="h-4 w-4" /> Try it below <ArrowRight className="h-4 w-4" />
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}
