import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  compress: true,
  // Hide the "N" dev indicator in the bottom-left during local dev so
  // recordings and screenshots don't show a Next.js badge. No effect
  // in production (the indicator is dev-only anyway).
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "lh6.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
    ],
  },
  poweredByHeader: false,
  // Common aliases that crawlers + occasional users probe — redirect them
  // to the canonical page rather than serving 404s (bad for SEO signals).
  async redirects() {
    return [
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/company", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/plans", destination: "/pricing", permanent: true },
      { source: "/price", destination: "/pricing", permanent: true },
      { source: "/product", destination: "/", permanent: true },
      { source: "/platform", destination: "/", permanent: true },
      { source: "/how-it-works", destination: "/demo", permanent: true },
      { source: "/use-cases", destination: "/", permanent: true },
      { source: "/customers", destination: "/", permanent: true },
      // /founder (singular founder story) was too close to /founders
      // (plural directory) — renamed to /story for zero-ambiguity.
      // Redirect preserves inbound SEO + any external links pointing
      // at the old URL.
      { source: "/founder", destination: "/story", permanent: true },
      // Old sample /w/demo wall (LinenLab mock content) redirects
      // to the founder's real Wall of Love. Every incoming link
      // across the codebase — home hero "See a live wall →", demo
      // page CTAs, /vs pages, /features, /not-found, etc. — now
      // lands on the real wall without touching those callsites.
      // Permanent (308) so Google consolidates ranking signal onto
      // the destination URL. `?showcase=1` forces the signup +
      // testify surfaces ON regardless of the workspace's plan, so
      // marketing-redirected traffic always hits a wall that
      // converts (a Pro upgrade normally hides those surfaces).
      {
        source: "/w/demo",
        destination: "/w/cmtedlomj0009w0btzyi3yweh?showcase=1",
        permanent: true,
      },
      // Short, brandable URL for the founder's "fill this 30-second
      // form" CTA on the home page. Redirects to the actual Testimoni
      // collection form so we can swap the underlying form later
      // without touching the public URL or the home page copy.
      // Non-permanent so we can retarget without SEO baggage.
      {
        source: "/setup",
        destination: "/collect/founder/customer-feedback",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
