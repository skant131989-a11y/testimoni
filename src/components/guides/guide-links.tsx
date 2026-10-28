import Link from "next/link";

const LINKS = [
  { href: "/turn-tweets-into-testimonials", label: "Turn tweets into testimonials" },
  { href: "/import-linkedin-recommendations", label: "Collect LinkedIn praise" },
  { href: "/embed-testimonials-without-screenshots", label: "Embed testimonials without screenshots" },
  { href: "/wall-of-love", label: "Create a Wall of Love" },
  { href: "/testimonial-widget-for-founders", label: "Testimonial widget for solo founders" },
  { href: "/blog/best-testimonial-tools", label: "Best testimonial tools, compared" },
  { href: "/senja-alternatives", label: "Senja alternatives" },
  { href: "/vs/famewall", label: "Testimoni vs Famewall" },
  { href: "/vs/shapo", label: "Testimoni vs Shapo" },
];

/** Crawlable internal links to the answer pages, for high-traffic pages. */
export function GuideLinks() {
  return (
    <section className="border-t py-8">
      <div className="mx-auto max-w-5xl px-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Use cases &amp; guides</p>
        <div className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2 md:grid-cols-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
