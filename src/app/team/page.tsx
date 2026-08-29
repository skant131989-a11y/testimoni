import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "The Testimoni team",
  description:
    "Meet the team building Testimoni — the fastest testimonial widget for SaaS founders, coaches, and D2C brands. Solo founder, shipping in public.",
  alternates: { canonical: "/team" },
};

const team = [
  {
    name: "Neha Singh",
    role: "Founder & CEO",
    bio: "Building Testimoni end-to-end — product, engineering, design, and support. On a mission to make customer testimonials feel effortless for every SaaS founder, coach, and D2C brand.",
    x: "https://x.com/usetestimoni",
    linkedin: "https://www.linkedin.com/company/144771086",
  },
];

export default function TeamPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Users className="h-3 w-3" />
              Team
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              A small team, shipping fast
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Testimoni is built by a lean team. Everyone here talks to customers,
              writes code, and ships features every week.
            </p>
          </div>

          <div className="mt-12 grid gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl border bg-card p-6 md:flex md:items-start md:gap-6"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {member.name.charAt(0)}
                </div>
                <div className="mt-4 flex-1 md:mt-0">
                  <h2 className="text-xl font-bold">{member.name}</h2>
                  <p className="text-sm font-medium text-primary">{member.role}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{member.bio}</p>
                  <div className="mt-4 flex gap-3 text-sm">
                    <a
                      href={member.x}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      X
                    </a>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border-2 border-dashed p-6 text-center">
            <h2 className="text-lg font-semibold">We&apos;re hiring — eventually</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Not yet, but soon. If you love making beautiful software and hate
              the testimonial-collection mess as much as we do, keep an eye on
              this page.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link href="/contact">
                Say hi <ArrowRight className="ml-1 h-3 w-3" />
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
