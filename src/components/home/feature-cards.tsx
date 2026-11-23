import { ArrowRight, BarChart3, Bell, Code2, FileText, Inbox, LayoutGrid, QrCode, Sparkles } from "lucide-react";
import { TrackedLink } from "@/components/tracked-link";

type Item = { text: string; tag?: string; href?: string; cta?: string };

function Group({
  Icon,
  title,
  note,
  items,
  className = "",
  href,
  children,
}: {
  Icon: typeof FileText;
  title: string;
  note: string;
  items: Item[];
  className?: string;
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col rounded-3xl border border-violet-200 bg-card p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <div>
          <h3 className="text-xl font-bold leading-tight">
            {href ? (
              <TrackedLink
                cta={"feature_group_" + title.toLowerCase().replace(/\W+/g, "_")}
                surface="home"
                href={href}
                className="group inline-flex items-center gap-1 hover:text-primary"
              >
                {title}
                <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-0.5" />
              </TrackedLink>
            ) : (
              title
            )}
          </h3>
          <p className="text-sm text-muted-foreground">{note}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-5 sm:flex-row">
        <ul className="flex-1 space-y-2.5 text-sm">
          {items.map((i) => (
            <li key={i.text} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>
                {i.href ? (
                  <TrackedLink
                    cta={i.cta ?? "feature_item"}
                    surface="home"
                    href={i.href}
                    className="group inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {i.text}
                    <ArrowRight className="h-3.5 w-3.5 text-primary transition group-hover:translate-x-0.5" />
                  </TrackedLink>
                ) : (
                  i.text
                )}
                {i.tag && (
                  <span className="ml-1.5 rounded-full bg-violet-100 px-2 py-0.5 align-middle text-[10px] font-semibold text-primary">
                    {i.tag}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {children}
      </div>
    </div>
  );
}

/**
 * Everything the product does, in four cards instead of four long lists.
 * Tags only where a plan really limits the feature (see lib/plan-features.ts).
 * Mock content is labelled as an example.
 */
export function FeatureCards() {
  return (
    <section id="features" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Features</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Everything in one place.</h2>
          <p className="mt-3 text-lg text-muted-foreground">Collect, manage and show testimonials. Nothing to stitch together.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {/* Collect (wide) with the QR poster */}
          <Group
            Icon={FileText}
            title="Collect"
            note="Get the words in"
            className="md:col-span-2"
            items={[
              { text: "Forms with text, star ratings and video", tag: "1 free, unlimited on Pro" },
              { text: "Share by link, email, WhatsApp, DM, QR code or embed" },
              { text: "Ask by email, or automatically from a webhook, with a reminder", tag: "3/mo free" },
              { text: "Starter prompts and a free AI helper so customers finish their review" },
              { text: "A thank-you gift after they submit, and a card of their words to share" },
              { text: "Import reviews from app stores and Product Hunt" },
            ]}
          >
            <TrackedLink
              cta="feature_qr_poster"
              surface="home"
              href="/signup?src=home_poster"
              className="block w-full shrink-0 rounded-2xl bg-violet-50 p-4 transition hover:bg-violet-100 sm:w-44"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Example poster</p>
              <div className="mt-2 rounded-xl border border-violet-200 bg-white p-3 text-center">
                <p className="text-xs font-bold leading-tight">Loved your visit?</p>
                <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-lg bg-slate-900">
                  <QrCode className="h-14 w-14 text-white" />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Scan and tell us in 30 seconds</p>
              </div>
              <p className="mt-2 text-center text-xs font-medium text-primary">Print-ready QR poster &rarr;</p>
            </TrackedLink>
          </Group>

          {/* Manage */}
          <Group
            Icon={Inbox}
            title="Manage"
            note="You stay in control"
            href="/features"
            items={[
              { text: "One inbox: approve or reject with a click" },
              { text: "Edit the wording, name and title before you publish" },
              { text: "Approve from the email in one tap, no login" },
              { text: "Live alert in your dashboard" },
              { text: "A weekly note: views, what is new, one next step" },
              { text: "Analytics on your wall", tag: "Pro" },
            ]}
          />

          {/* Show */}
          <Group
            Icon={LayoutGrid}
            title="Show"
            note="Put it where people look"
            items={[
              { text: "A hosted Wall of Love page, free", href: "/w/demo", cta: "feature_sample_wall" },
              { text: "One line of code for any site, styles isolated", href: "/testimonial-widget", cta: "feature_embed" },
              { text: "Grid free; masonry, carousel, list and marquee", tag: "Pro" },
              { text: "Your branding, no watermark, Trust Score badge", tag: "Pro" },
              { text: "Review markup so Google and AI can read your wall" },
            ]}
          />

          {/* Beyond collecting (wide) */}
          <Group
            Icon={Sparkles}
            title="Beyond collecting"
            note="Tools for finding and using praise"
            className="md:col-span-2"
            items={[
              { text: "Find my praise: scan the web for real posts about you", href: "/tools/find-my-proof", cta: "feature_find_praise" },
              { text: "Customer Voice: praise, complaints and requests, free summary", href: "/tools/customer-voice", cta: "feature_customer_voice" },
              { text: "Wall Score: audit your wall from 0 to 100", tag: "1 free, unlimited on Pro" },
              { text: "Ask My Wall: a chatbot that quotes your real customers", tag: "30 answers free" },
              { text: "Tweet drafts from any quote", tag: "5 a month free", href: "/tools/praise-tweet-finder", cta: "feature_tweets" },
              { text: "Case study generator and weekly new-praise email", tag: "Pro" },
            ]}
          >
            <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-44 sm:grid-cols-1">
              {[
                { Icon: BarChart3, t: "Wall Score", v: "82 / 100" },
                { Icon: Bell, t: "New praise", v: "3 this week" },
                { Icon: Code2, t: "Embed", v: "1 line" },
              ].map(({ Icon, t, v }) => (
                <div key={t} className="flex items-center gap-2.5 rounded-xl bg-violet-50 px-3 py-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <div className="leading-tight">
                    <p className="text-[11px] text-muted-foreground">{t}</p>
                    <p className="text-sm font-bold">{v}</p>
                  </div>
                </div>
              ))}
              <p className="col-span-2 text-center text-[11px] text-muted-foreground sm:col-span-1">Example numbers</p>
            </div>
          </Group>
        </div>

        <div className="mt-8 text-center">
          <TrackedLink
            cta="features_all"
            surface="home"
            href="/features"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            See every feature <ArrowRight className="h-4 w-4" />
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
