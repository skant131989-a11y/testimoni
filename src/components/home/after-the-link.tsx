import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, Gift, Mail, QrCode, Share2, Sparkles, Star } from "lucide-react";
import { FadeIn } from "@/components/fade-in";
import { TrackedLink } from "@/components/tracked-link";

/**
 * "Everything after you share the link": the whole path from a customer's
 * phone to the owner's wall, shown as small pictures of the real screens.
 * Every picture is labelled as an example (the names and numbers are made up).
 */

function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="flex gap-0.5 text-amber-400" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < n ? "fill-current" : "text-gray-200"}`} />
      ))}
    </span>
  );
}

function Mock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-3.5">
      <p className="mb-2 text-right text-[9px] font-semibold uppercase tracking-wide text-violet-400">Example</p>
      {children}
    </div>
  );
}

function Step({ n, title, body, children }: { n: number; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mb-4 mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

export function AfterTheLink() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">From their phone to your wall</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Everything after you share the link is handled</h2>
          <p className="mt-3 text-muted-foreground">
            Customers finish reviews when it is easy. You approve in one tap. Here is the whole path.
          </p>
        </div>

        <div className="mt-12 grid gap-12">
          {/* Their side */}
          <div>
            <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-violet-700">What your customer sees</p>
            <div className="grid gap-4 md:grid-cols-3">
              <FadeIn delay={0}>
                <Step n={1} title="Scan or tap" body="Print a QR poster for your counter, or share your link anywhere.">
                  <Mock>
                    <div className="flex flex-col items-center rounded-lg border-2 border-violet-700 bg-white px-3 py-3 text-center">
                      <p className="text-[11px] font-extrabold leading-tight text-neutral-900">
                        Loved it? <span className="text-violet-700">Tell us in 20 seconds.</span>
                      </p>
                      <QrCode className="mt-2 h-14 w-14 text-violet-900" />
                    </div>
                  </Mock>
                </Step>
              </FadeIn>
              <FadeIn delay={80}>
                <Step n={2} title="Finish in seconds" body="Starter prompts and a free AI helper turn a few rough words into a sentence.">
                  <Mock>
                    <Stars />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["What I like most is", "The best part was"].map((c) => (
                        <span key={c} className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] text-violet-800">
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <Sparkles className="h-3 w-3" /> Type it roughly, we write it
                    </p>
                  </Mock>
                </Step>
              </FadeIn>
              <FadeIn delay={160}>
                <Step n={3} title="A thank-you and a card" body="Offer a gift. They get a card of their words to share, which brings you more reviews.">
                  <Mock>
                    <div className="rounded-lg border-2 border-dashed border-violet-300 bg-violet-50 px-2.5 py-1.5">
                      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                        <Gift className="h-3 w-3" /> Thank-you gift
                      </p>
                      <p className="text-xs font-semibold text-violet-950">10% off your next order</p>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-sky-700">
                      <Share2 className="h-3 w-3" /> Share their words on X or LinkedIn
                    </p>
                  </Mock>
                </Step>
              </FadeIn>
            </div>
          </div>

          {/* Your side */}
          <div>
            <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-violet-700">What you see</p>
            <div className="grid gap-4 md:grid-cols-3">
              <FadeIn delay={0}>
                <Step n={4} title="You hear straight away" body="A live alert in your dashboard, with Approve right on it, and a count in the tab.">
                  <Mock>
                    <div className="rounded-lg border border-violet-200 bg-white p-2.5 shadow-sm">
                      <p className="flex items-center gap-1 text-[11px] font-semibold">
                        <Bell className="h-3 w-3 text-violet-600" /> New testimonial from Priya
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10px] italic text-muted-foreground">&ldquo;Setup took ten minutes and support replied the same day.&rdquo;</p>
                      <div className="mt-2 flex gap-1.5">
                        <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Approve</span>
                        <span className="rounded-md border px-2 py-0.5 text-[10px] font-semibold">Review</span>
                      </div>
                    </div>
                  </Mock>
                </Step>
              </FadeIn>
              <FadeIn delay={80}>
                <Step n={5} title="Approve from your phone" body="One tap from the email, no login. Opening the link changes nothing until you tap.">
                  <Mock>
                    <div className="rounded-lg border bg-white p-2.5">
                      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Mail className="h-3 w-3" /> Priya left a testimonial
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10px] italic">&ldquo;Honestly the cleanest way I&apos;ve found…&rdquo;</p>
                      <span className="mt-2 inline-block rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
                        Approve or reject &rarr;
                      </span>
                    </div>
                  </Mock>
                </Step>
              </FadeIn>
              <FadeIn delay={160}>
                <Step n={6} title="A weekly note" body="Views, what is new and one next step, every Monday. Only when something happened.">
                  <Mock>
                    <div className="flex items-end gap-4">
                      {[
                        ["42", "views"],
                        ["3", "new"],
                        ["14", "on your wall"],
                      ].map(([n, l]) => (
                        <div key={l}>
                          <p className="text-xl font-extrabold leading-none text-violet-900">{n}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{l}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Next: ask three more customers
                    </p>
                  </Mock>
                </Step>
              </FadeIn>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <TrackedLink
            cta="journey_start_free"
            surface="home"
            href="/signup?src=home_journey"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5"
          >
            Create my free wall <ArrowRight className="h-4 w-4" />
          </TrackedLink>
          <Link href="/demo" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Try the live demo first
          </Link>
        </div>
      </div>
    </section>
  );
}
