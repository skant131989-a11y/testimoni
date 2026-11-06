import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

/**
 * The one footer for every public page. Before this, the home page had
 * its own long footer and most other pages ended in a bare copyright
 * line, so visitors on /pricing or a blog post had nowhere to go next
 * and search engines found few internal links from those pages.
 *
 * Plain server component (no hooks) so it can be dropped into server
 * and client pages alike.
 */

type FooterLink = { label: string; href: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Live demo", href: "/demo" },
      { label: "Sample Wall of Love", href: "/w/demo" },
      { label: "Docs", href: "/docs" },
      { label: "Enterprise", href: "/enterprise" },
    ],
  },
  {
    title: "Free tools",
    links: [
      { label: "Find my proof", href: "/tools/find-my-proof" },
      { label: "Customer Voice scan", href: "/tools/customer-voice" },
      { label: "Screenshot → testimonial", href: "/tools/screenshot-to-testimonial" },
      { label: "Praise tweet finder", href: "/tools/praise-tweet-finder" },
      { label: "LinkedIn recommendations", href: "/tools/linkedin-recommendation" },
      { label: "Testimonial writer", href: "/tools/testimonial-writer" },
      { label: "Testimonial card", href: "/tools/testimonial-card" },
      { label: "Ask templates", href: "/tools/ask-templates" },
      { label: "Star badge", href: "/tools/star-badge" },
    ],
  },
  {
    title: "Built for",
    links: [
      { label: "SaaS founders", href: "/for/saas" },
      { label: "Course creators", href: "/for/course-creators" },
      { label: "Shopify / D2C", href: "/for/shopify" },
      { label: "Freelancers", href: "/for/freelancers" },
      { label: "Agencies", href: "/for/agencies" },
      { label: "Photographers", href: "/for/photographers" },
      { label: "Real estate agents", href: "/for/real-estate-agents" },
      { label: "Wedding vendors", href: "/for/wedding-vendors" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "Best testimonial tools", href: "/blog/best-testimonial-tools" },
      { label: "Senja alternatives", href: "/senja-alternatives" },
      { label: "vs Senja", href: "/vs/senja" },
      { label: "vs Testimonial.to", href: "/vs/testimonial-to" },
      { label: "vs Famewall", href: "/vs/famewall" },
      { label: "vs Shapo", href: "/vs/shapo" },
      { label: "vs Trustmary", href: "/vs/trustmary" },
      { label: "vs Vocal Video", href: "/vs/vocal-video" },
    ],
  },
  {
    title: "Learn & company",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Turn tweets into testimonials", href: "/turn-tweets-into-testimonials" },
      { label: "Collect LinkedIn praise", href: "/import-linkedin-recommendations" },
      { label: "Embed without screenshots", href: "/embed-testimonials-without-screenshots" },
      { label: "Create a Wall of Love", href: "/wall-of-love" },
      { label: "Widget for solo founders", href: "/testimonial-widget-for-founders" },
      { label: "About", href: "/about" },
      { label: "Our story", href: "/story" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const LEGAL: FooterLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Security", href: "/security" },
];

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Brand + one clear next step */}
        <div className="flex flex-col gap-6 border-b pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon.png"
                alt="Testimoni logo"
                width={28}
                height={28}
                className="rounded-full"
              />
              <span className="text-lg font-bold">Testimoni</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Turn the praise customers already posted into testimonials on
              your site. Free for 15 testimonials; Pro is a flat $19/month.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:self-auto"
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Link columns */}
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-6 gap-y-10 pt-10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Legal + social */}
        <div className="mt-12 flex flex-col gap-4 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Testimoni. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            ))}
            <a
              href="https://x.com/usetestimoni"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label="Testimoni on X (Twitter)"
            >
              X
            </a>
            <a
              href="https://www.linkedin.com/company/144771086"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              aria-label="Testimoni on LinkedIn"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
