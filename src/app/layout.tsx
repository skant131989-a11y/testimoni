import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PricingProvider } from "@/lib/use-pricing";
import { AnalyticsInit } from "@/components/analytics-init";
import { TopProgressBar } from "@/components/top-progress-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Testimoni — Paste a Tweet, Get a Testimonial",
    template: "%s · Testimoni",
  },
  description:
    "Turn any X or LinkedIn post into a live testimonial in 30 seconds — no screenshots, no copy-paste. Or collect fresh ones via form. Free wall of love + one-line embed.",
  applicationName: "Testimoni",
  keywords: [
    "testimonial widget",
    "collect testimonials",
    "customer testimonials",
    "wall of love",
    "social proof",
    "testimonial software",
    "video testimonials",
    "SaaS testimonials",
    "embed testimonials",
    "testimonial platform",
    "Senja alternative",
    "Testimonial.to alternative",
    "review widget",
    "customer reviews",
  ],
  authors: [{ name: "Testimoni" }],
  creator: "Testimoni",
  publisher: "Testimoni",
  category: "Software",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Testimoni",
    title: "Testimoni — Paste a Tweet, Get a Testimonial",
    description:
      "Turn any X or LinkedIn post into a testimonial in 30 seconds. Free wall of love, one-line embed.",
    images: [
      {
        url: "/opengraph-image?v=8",
        width: 1200,
        height: 630,
        alt: "Testimoni — Paste a tweet, get a testimonial in 30 seconds",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@usetestimoni",
    creator: "@usetestimoni",
    title: "Testimoni — Paste a Tweet, Get a Testimonial",
    description:
      "Turn any X or LinkedIn post into a testimonial in 30 seconds. Free plan.",
    images: ["/twitter-image?v=8"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    // Add these when you set up Google Search Console / Bing Webmaster
    // google: "your-google-verification-code",
    // other: { "msvalidate.01": "your-bing-verification-code" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : null;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Preconnect to Supabase so the first auth + DB call races DNS */}
        {supabaseHost && (
          <>
            <link rel="preconnect" href={supabaseHost} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseHost} />
          </>
        )}
        {/* DNS-prefetch Razorpay for faster first checkout script fetch */}
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <TopProgressBar />
        <AnalyticsInit />
        <PricingProvider>{children}</PricingProvider>
      </body>
    </html>
  );
}
