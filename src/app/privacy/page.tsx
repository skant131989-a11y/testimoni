import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "Privacy Policy — Testimoni",
  description:
    "How Testimoni collects, uses, and protects data belonging to workspace owners and the customers who submit testimonials.",
  alternates: { canonical: "/privacy" },
};

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@testimoni.io";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <article className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective: August 29, 2026 · Last updated: August 29, 2026
          </p>

          <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
            <p>
              Testimoni is operated by Neha Singh, doing business as Testimoni
              (&quot;we&quot;, &quot;us&quot;, &quot;the Service&quot;). This
              Privacy Policy explains what personal information we collect, why
              we collect it, how we use it, and the rights you have. By using{" "}
              <a href="https://testimoni.io">testimoni.io</a> and its
              subdomains, you agree to this policy.
            </p>

            <h2>Who this policy covers</h2>
            <p>Two groups of people interact with Testimoni:</p>
            <ul>
              <li>
                <strong>Workspace owners</strong> — anyone who signs up for a
                Testimoni account to collect testimonials.
              </li>
              <li>
                <strong>Testimonial submitters</strong> — customers of a
                workspace owner who fill out a collection form.
              </li>
            </ul>
            <p>Different rules apply to each group. Both are covered below.</p>

            <h2>What we collect from workspace owners</h2>
            <ul>
              <li>
                <strong>Account data:</strong> name, email address, password
                hash (via Supabase Auth), avatar URL if you sign in with
                Google, and the workspace name / slug you choose.
              </li>
              <li>
                <strong>Billing data:</strong> if you upgrade to Pro, our
                payment processor (Razorpay) collects your billing address,
                card details, and transaction history. We never see or store
                your card details on our servers — we only receive a token
                that identifies your subscription.
              </li>
              <li>
                <strong>Usage data:</strong> which pages of the dashboard you
                visit, when you approve or reject testimonials, and basic
                event timestamps. We use this to improve the product; it is
                never sold.
              </li>
              <li>
                <strong>Support conversations:</strong> emails or contact-form
                submissions you send to us at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </li>
            </ul>

            <h2>What we collect from testimonial submitters</h2>
            <p>
              When a customer of a Testimoni workspace fills out a collection
              form, we collect and store:
            </p>
            <ul>
              <li>Their name (required).</li>
              <li>Their email address (optional).</li>
              <li>Their testimonial content, star rating, and any optional job title.</li>
              <li>Any images or videos they attach (1 free video per workspace; unlimited on Pro).</li>
              <li>The submission timestamp.</li>
            </ul>
            <p>
              This data belongs to the workspace owner who runs that form —
              they are the data controller. Testimoni acts as a data processor
              on their behalf. If you submitted a testimonial and want it
              removed, contact the workspace directly first; contact us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if the
              workspace does not respond.
            </p>

            <h2>How we use data</h2>
            <ul>
              <li>To provide the Service (host your account, render widgets, deliver testimonials).</li>
              <li>To process payments and prevent fraud.</li>
              <li>To send transactional emails (verification links, receipts, security alerts).</li>
              <li>To improve product usability and diagnose bugs.</li>
              <li>To respond to your support requests.</li>
            </ul>
            <p>
              We do not sell personal data, and we do not use it for
              advertising.
            </p>

            <h2>Third parties we share data with</h2>
            <p>
              Testimoni is built on top of these providers. By using
              Testimoni, you also agree to their privacy practices:
            </p>
            <ul>
              <li>
                <strong>Vercel</strong> — website hosting and CDN.{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                  vercel.com/legal/privacy-policy
                </a>
              </li>
              <li>
                <strong>Supabase</strong> — authentication and Postgres database.{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                  supabase.com/privacy
                </a>
              </li>
              <li>
                <strong>Razorpay</strong> — payment processing (INR and
                international cards).{" "}
                <a href="https://razorpay.com/privacy" target="_blank" rel="noopener noreferrer">
                  razorpay.com/privacy
                </a>
              </li>
              <li>
                <strong>Google</strong> — optional sign-in method (Google OAuth).{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  policies.google.com/privacy
                </a>
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery
                (verification emails, receipts, security alerts).{" "}
                <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                  resend.com/legal/privacy-policy
                </a>
              </li>
              <li>
                <strong>ImprovMX</strong> — inbound mail forwarding for our
                support address to the operators.{" "}
                <a href="https://improvmx.com/privacy" target="_blank" rel="noopener noreferrer">
                  improvmx.com/privacy
                </a>
              </li>
            </ul>
            <p>
              We share only the minimum data each provider needs to perform
              its role.
            </p>

            <h2>Data location and retention</h2>
            <p>
              Data is stored on Supabase and Vercel in the regions configured
              for this project. Contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you
              need the current region. We keep account data for as long as
              your account is active. If you delete your account, we delete
              your workspace and its testimonials within 30 days. Billing
              records may be retained for up to 7 years to comply with tax
              and financial regulations.
            </p>

            <h2>Cookies and local storage</h2>
            <p>
              We use essential cookies to keep you signed in and store your
              preferred pricing currency (USD/INR). We do not use tracking
              cookies for advertising. Any analytics we add later will be
              privacy-respecting and disclosed here.
            </p>

            <h2>Your rights</h2>
            <p>You can, at any time:</p>
            <ul>
              <li>Access the data we have about you (email us).</li>
              <li>Correct inaccurate data (via your dashboard or by emailing us).</li>
              <li>Delete your account and all associated workspace data.</li>
              <li>Export a copy of your testimonials as CSV or JSON (email support).</li>
              <li>Opt out of non-essential communications.</li>
            </ul>
            <p>
              GDPR (EU / UK) and DPDP (India) rights are honoured on request.
            </p>

            <h2>Security</h2>
            <p>
              We use industry-standard security controls: HTTPS everywhere,
              hashed passwords (via Supabase Auth), server-side session
              tokens, HTTPS-only cookies, and encrypted database backups. No
              system is 100% secure, but we treat security failures seriously
              and will notify affected users within 72 hours of a confirmed
              breach.
            </p>

            <h2>Children</h2>
            <p>
              Testimoni is not intended for people under 16. We do not
              knowingly collect data from children. If you believe a child
              has submitted data through our forms, email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we
              will remove it.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this policy as the product changes. Material
              changes will be announced via email or an in-app banner at
              least 14 days before taking effect. The &quot;Last updated&quot;
              date at the top of this page always reflects the current version.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy questions, data-access requests, or complaints,
              email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We
              respond within 5 business days.
            </p>

            <p className="mt-8 text-sm text-muted-foreground">
              See also: <Link href="/terms">Terms of Service</Link>.
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
