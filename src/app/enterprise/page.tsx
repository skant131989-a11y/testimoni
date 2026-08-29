import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Building2, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "Testimoni for Enterprise",
  description:
    "Testimoni for larger teams — unlimited seats, custom SLAs, SSO, dedicated support, and volume pricing. Talk to us about your requirements.",
  alternates: { canonical: "/enterprise" },
};

export default function EnterprisePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Building2 className="h-3 w-3" />
              Enterprise
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Testimoni for larger teams
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              If you&apos;re rolling Testimoni out across multiple brands, need
              specific compliance guarantees, or want a custom pricing model —
              let&apos;s talk.
            </p>
          </div>

          <section className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Users,
                title: "Multiple workspaces & seats",
                desc: "One Testimoni account, separate workspaces per brand or product line, unlimited team members per workspace.",
              },
              {
                icon: Shield,
                title: "SSO & audit logs",
                desc: "SAML SSO integration and audit trails for every approve/reject action. Roll out to your team behind your existing identity provider.",
              },
              {
                icon: Zap,
                title: "Custom SLAs & support",
                desc: "Guaranteed response times, a shared Slack channel, and a named contact for anything that breaks or blocks.",
              },
              {
                icon: Building2,
                title: "Volume pricing",
                desc: "Predictable annual pricing that scales with the number of workspaces and testimonials you actually use — not per-seat charges.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </section>

          <section className="mt-16 rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Talk to us</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Enterprise is bespoke — no menu. Tell us how many workspaces, how
              many testimonials, what compliance you need, and we&apos;ll come
              back with a proposal within two business days.
            </p>
            <Button size="lg" asChild className="mt-6">
              <Link href="/contact">
                Start the conversation <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Or if a self-serve Pro plan is enough for now, see{" "}
              <Link href="/pricing" className="text-primary underline">
                pricing
              </Link>{" "}
              — most teams start there and upgrade when they need it.
            </p>
          </section>
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
