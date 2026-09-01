import Link from "next/link";
import type { Metadata } from "next";
import { Mail, MessageSquare, Sparkles } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import PublicCollectionForm from "@/components/collection/public-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Contact — Share your feedback",
  description:
    "Feedback, feature requests, bug reports — reach the Testimoni team. This page uses Testimoni's own collection form, so you can see the product working.",
  alternates: { canonical: "/contact" },
};

/**
 * Public contact / feedback page.
 *
 * Dogfoods Testimoni's own collection form: reads NEXT_PUBLIC_FEEDBACK_FORM_ID
 * from env vars and renders the same form embed a customer of yours would see.
 * If the env var is missing, shows a graceful "email us" fallback.
 */
export default async function ContactPage() {
  const formId = process.env.NEXT_PUBLIC_FEEDBACK_FORM_ID;
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@testimoni.io";

  let formConfig: React.ComponentProps<typeof PublicCollectionForm>["formConfig"] | null = null;
  if (formId) {
    try {
      const form = await prisma.collectionForm.findFirst({
        where: { id: formId, isActive: true },
        select: {
          id: true,
          headline: true,
          description: true,
          allowRating: true,
          allowVideo: true,
          thankYouMessage: true,
          workspace: { select: { name: true, logoUrl: true } },
        },
      });
      if (form) {
        formConfig = {
          id: form.id,
          headline: form.headline,
          description: form.description,
          allowRating: form.allowRating,
          allowVideo: form.allowVideo,
          thankYouMessage: form.thankYouMessage,
          workspace: { name: form.workspace.name, logoUrl: form.workspace.logoUrl },
        };
      }
    } catch {
      formConfig = null;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <MessageSquare className="h-3 w-3" />
              Get in touch
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Tell us what you think
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Feedback, feature requests, bug reports, or just saying hi — we&apos;d love to hear from you.
            </p>
          </div>

          {formConfig ? (
            <>
              {/* Meta-marketing callout: THIS form is literally your own product */}
              <div className="mx-auto mt-8 max-w-lg rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-start gap-2 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Meta moment:</span>{" "}
                    this form is built with Testimoni. It&apos;s exactly what your customers would see when you share a collection link.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <PublicCollectionForm formConfig={formConfig} />
              </div>

              {/* Always show the email escape hatch — some people prefer email */}
              <div className="mx-auto mt-8 max-w-lg rounded-xl border bg-card p-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Prefer email?</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reach us directly at{" "}
                  <a
                    href={`mailto:${supportEmail}?subject=Testimoni feedback`}
                    className="font-medium text-primary hover:underline"
                  >
                    {supportEmail}
                  </a>
                </p>
              </div>
            </>
          ) : (
            <div className="mx-auto mt-10 max-w-md rounded-2xl border bg-card p-8 text-center">
              <Mail className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-xl font-bold">Reach us by email</h2>
              <p className="mt-2 text-muted-foreground">
                Send a note and we&apos;ll get back within a business day.
              </p>
              <a
                href={`mailto:${supportEmail}?subject=Testimoni feedback`}
                className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {supportEmail}
              </a>
              <p className="mt-6 text-xs text-muted-foreground">
                (Contact form powered by Testimoni will appear here once configured.)
              </p>
            </div>
          )}

          <div className="mt-12 text-center text-sm text-muted-foreground">
            Or explore{" "}
            <Link href="/demo" className="font-medium text-primary hover:underline">
              the live demo
            </Link>{" "}
            first.
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
