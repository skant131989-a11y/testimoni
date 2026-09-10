"use client";

import Link from "next/link";
import { FileText, ArrowRight, Heart } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * StartFromScratch — Section 4 on the home page. The third door for
 * founders whose customers don't tweet or leave public reviews.
 * Soft card, no gradient — signals "quieter alternative" to the
 * two flashier entry points above.
 */

export function StartFromScratch() {
  return (
    <section className="relative overflow-hidden border-t bg-gradient-to-br from-emerald-50 via-teal-50/70 to-cyan-50/40 py-16 md:py-24">
      {/* Ambient depth — mint blobs, mirrors the hero/section-2 style
          so the three top sections read as a coordinated triptych. */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-teal-300/25 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4">
        <div className="rounded-3xl border-2 border-emerald-200/70 bg-white/80 p-8 shadow-xl shadow-emerald-500/10 backdrop-blur md:p-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              <FileText className="h-3 w-3" /> The classic path
            </span>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Or grow it the{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                old-fashioned way
              </span>
              .
            </h2>
            <p className="mx-auto max-w-lg text-base text-muted-foreground md:text-lg">
              Not everyone tweets. Get a shareable form link the moment you
              sign up — send it to your 5 happiest customers and your wall
              goes live tonight.
            </p>
            <div className="mt-2 flex flex-col items-center gap-2">
              <Link
                href="/signup?src=home_form_path"
                onClick={() =>
                  track("home_start_from_scratch_cta", { placement: "section3" })
                }
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30 md:text-base"
              >
                <Heart className="h-4 w-4" />
                Sign up & send my first form
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="text-xs text-muted-foreground">
                Free forever · 10 testimonials · 1 wall · No credit card
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
