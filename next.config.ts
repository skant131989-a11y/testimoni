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
    ];
  },
};

export default nextConfig;
