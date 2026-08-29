import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Shield, Lock, Server, Database, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "Security — Testimoni",
  description:
    "How Testimoni handles your data: encryption in transit, row-level isolation, secure OAuth, and PCI-compliant payments through Razorpay.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Shield className="h-3 w-3" />
              Security
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              How we handle your data
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Testimoni is built on standard, audited infrastructure. This page
              is straight about what&apos;s in place today and what we&apos;re
              working on next.
            </p>
          </div>

          <div className="mt-12 grid gap-6">
            {[
              {
                icon: Lock,
                title: "Encryption in transit",
                desc: "All traffic to testimoni.io and our APIs uses TLS 1.3. The embed script served to your site is also HTTPS-only.",
              },
              {
                icon: Database,
                title: "Isolated workspaces",
                desc: "Every workspace is scoped by ID in every query — one workspace can never read another's testimonials, submissions, widgets, or subscription. Enforced at the database query layer.",
              },
              {
                icon: Server,
                title: "Managed infrastructure",
                desc: "Compute runs on Vercel (SOC 2 Type II), our Postgres runs on Supabase (SOC 2 Type II), and object storage runs on Supabase Storage. We don't run our own servers.",
              },
              {
                icon: Shield,
                title: "Auth via Supabase Auth",
                desc: "Password hashing, session management, and Google OAuth are handled by Supabase Auth. Sessions live in HTTP-only cookies; we never touch raw tokens.",
              },
              {
                icon: Lock,
                title: "PCI-compliant payments",
                desc: "Card details are entered directly into Razorpay's checkout modal — the numbers never touch our servers. Razorpay is PCI DSS Level 1 certified.",
              },
              {
                icon: Mail,
                title: "Minimal data collection",
                desc: "We store what's needed to run the product: your account, your workspace's testimonials, and your subscription. No third-party analytics tracking your customers on your embedded widgets.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-2xl border bg-card p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border-2 border-dashed p-6">
            <h2 className="text-lg font-semibold">What&apos;s coming</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              SOC 2 Type II report (we inherit our subprocessors&apos; certifications
              today, but our own audit is planned for 2027). GDPR data-export &
              deletion self-service. Enterprise SSO (SAML). Audit logs.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Need something specific for your compliance review? Email us — we
              answer within a business day.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/contact">
                Contact security team <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
