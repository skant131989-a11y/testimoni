import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "Terms of Service — Testimoni",
  description:
    "The rules that govern your use of Testimoni. Written in plain language so you actually know what you're agreeing to.",
  alternates: { canonical: "/terms" },
};

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@testimoni.io";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <article className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective: August 29, 2026 · Last updated: August 29, 2026
          </p>

          <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your use of{" "}
              <a href="https://testimoni.io">testimoni.io</a>, its subdomains,
              and the associated products (collectively, &quot;the
              Service&quot;). The Service is operated by Neha Singh, doing
              business as Testimoni (&quot;we&quot;, &quot;us&quot;). By
              creating an account, embedding a widget, submitting a
              testimonial through a form, or otherwise using the Service, you
              agree to these Terms.
            </p>

            <h2>1. Who can use the Service</h2>
            <p>
              You must be at least 16 years old and legally able to enter into
              a binding contract in your country. If you use the Service on
              behalf of a company or other legal entity, you represent that
              you have authority to bind that entity to these Terms.
            </p>

            <h2>2. Account and security</h2>
            <ul>
              <li>You are responsible for keeping your login credentials secret.</li>
              <li>You may not share your account with someone else.</li>
              <li>You must notify us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you suspect unauthorised access.</li>
              <li>We may suspend accounts we reasonably believe are compromised, abandoned, or being used to break these Terms.</li>
            </ul>

            <h2>3. What the Service does</h2>
            <p>
              Testimoni lets you (a) create collection forms customers can
              use to submit testimonials, (b) approve or reject submissions,
              (c) build widgets and a hosted Wall of Love, (d) embed those
              widgets or share the hosted URL. Features available on each
              plan are described on our{" "}
              <Link href="/pricing">pricing page</Link> and may change from
              time to time.
            </p>

            <h2>4. Acceptable use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Break any law that applies to you or the people who submit through your forms.</li>
              <li>Publish testimonials that are fake, purchased, or knowingly misleading.</li>
              <li>Harass, defame, or harm any person.</li>
              <li>Distribute malware, spam, or phishing content through embed scripts or shared URLs.</li>
              <li>Reverse-engineer, resell, or clone the Service for commercial purposes.</li>
              <li>Scrape or overload the API beyond fair-use rate limits.</li>
            </ul>
            <p>
              We may remove content, suspend, or terminate accounts that
              violate this section, with or without notice, at our sole
              discretion.
            </p>

            <h2>5. Content ownership</h2>
            <p>
              You retain all rights to the testimonials, logos, and other
              content you upload or collect through Testimoni. By using the
              Service, you grant us a limited licence to host, display,
              cache, and process that content solely to provide the Service
              to you and your visitors.
            </p>
            <p>
              We do not claim any ownership of your customer testimonials.
              We will not use them for our own marketing without your written
              permission.
            </p>

            <h2>6. Fees, billing, and cancellations</h2>
            <ul>
              <li>The Free plan is free indefinitely, subject to the limits described on the pricing page.</li>
              <li>Pro is billed monthly through Razorpay. Prices are shown before purchase.</li>
              <li>Subscriptions renew automatically until you cancel from{" "}
                <Link href="/dashboard/settings/billing">
                  /dashboard/settings/billing
                </Link>. Cancellation takes effect at the end of the current billing period.
              </li>
              <li>Refunds are handled on a case-by-case basis. Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> within 14 days of the charge if something went wrong.</li>
              <li>We may change prices with 30 days&apos; notice; the change applies at your next renewal.</li>
            </ul>

            <h2>7. Termination</h2>
            <p>
              You may delete your account at any time. Once deleted, your
              workspace and all associated testimonials are removed within
              30 days. Billing records may be retained longer to satisfy
              tax and financial regulations.
            </p>
            <p>
              We may terminate or suspend accounts that violate these Terms,
              are inactive for more than 12 months, or if we discontinue the
              Service. If we discontinue, we will give you at least 60 days&apos;
              notice and provide a data export.
            </p>

            <h2>8. Third-party services</h2>
            <p>
              The Service integrates with Supabase, Razorpay, Vercel, Google,
              Resend, and ImprovMX. Your use of those services is also
              governed by their terms. We are not responsible for their
              availability or acts.
            </p>

            <h2>9. Disclaimers</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of
              any kind, express or implied, to the fullest extent permitted
              by law. We do not warrant that the Service will be
              uninterrupted, error-free, or free of harmful components. Use
              is at your own risk.
            </p>

            <h2>10. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, our total liability to
              you for any claim arising out of your use of the Service is
              limited to the amount you paid us in the 12 months preceding
              the event that gave rise to the claim. We are not liable for
              indirect, consequential, incidental, or punitive damages,
              including lost profits or lost data.
            </p>

            <h2>11. Governing law and disputes</h2>
            <p>
              These Terms are governed by the laws of India. Any dispute
              arising out of or in connection with these Terms will be
              subject to the exclusive jurisdiction of the courts of
              Bengaluru, India — unless mandatory local law in your
              jurisdiction requires otherwise.
            </p>

            <h2>12. Changes to these Terms</h2>
            <p>
              We may update these Terms as the Service evolves. Material
              changes will be announced via email or an in-app banner at
              least 14 days before taking effect. If you continue using the
              Service after that, you accept the updated Terms.
            </p>

            <h2>13. Contact</h2>
            <p>
              Questions? Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We
              respond within 5 business days.
            </p>

            <p className="mt-8 text-sm text-muted-foreground">
              See also: <Link href="/privacy">Privacy Policy</Link>.
            </p>
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
