import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PricingProvider } from "@/lib/use-pricing";

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
    default: "Testimoni · Collect & Display Customer Testimonials in Minutes",
    template: "%s · Testimoni",
  },
  description:
    "The fastest testimonial widget for SaaS, coaches, and D2C brands. Collect via link, form, iframe, email, or QR — then embed a beautiful wall of love on your site with one line of code. Free plan available.",
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
    title: "Testimoni · Collect & Display Customer Testimonials in Minutes",
    description:
      "The fastest testimonial widget for SaaS, coaches, and D2C brands. Collect testimonials via multiple channels and embed a beautiful wall of love in one line of code.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Testimoni — Collect and display customer testimonials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@usetestimoni",
    creator: "@usetestimoni",
    title: "Testimoni · Collect & Display Customer Testimonials",
    description:
      "The fastest way to collect testimonials and embed them anywhere. Free plan available.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
        <PricingProvider>{children}</PricingProvider>
      </body>
    </html>
  );
}
