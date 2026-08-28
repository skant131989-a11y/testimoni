import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Vercel compresses by default, keep explicit for parity with any other host
  compress: true,
  // Serve modern image formats when the browser supports them
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage avatars (customer + workspace logos)
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
      // Google avatars from OAuth signups
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      // Twitter avatars if we import testimonials
      { protocol: "https", hostname: "pbs.twimg.com" },
    ],
  },
  // Turn off the "x-powered-by: Next.js" header for a byte-shaving win
  poweredByHeader: false,
};

export default nextConfig;
