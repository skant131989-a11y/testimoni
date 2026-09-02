const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";

/**
 * JSON-LD structured data — helps Google surface Testimoni in rich results
 * and gives ChatGPT / Perplexity / Claude / Gemini machine-readable facts
 * about the product when someone asks "best testimonial widget."
 *
 * Rendered as a plain <script type="application/ld+json"> tag — the standard
 * way to inject structured data. Doesn't need next/script (which restricts
 * `beforeInteractive` to the root layout).
 */
export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}#software`,
        name: "Testimoni",
        url: SITE_URL,
        description:
          "Testimoni is a testimonial widget platform for SaaS founders, coaches, agencies, and D2C brands. Collect testimonials through custom forms (link, embed, iframe, email, QR), curate a library, and embed a beautiful wall of love on any website with one line of code.",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Marketing Software",
        operatingSystem: "Web",
        image: `${SITE_URL}/og-image.png`,
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description:
              "10 testimonials, 1 collection form, 1 widget, grid layout, with watermark.",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "9",
            priceCurrency: "USD",
            description:
              "Unlimited testimonials, forms, widgets. All layouts (Grid, Masonry, Carousel, List, Marquee). No watermark. Video testimonials.",
          },
          {
            "@type": "Offer",
            name: "Pro (INR)",
            price: "499",
            priceCurrency: "INR",
            description: "Same Pro plan, billed in INR through Razorpay.",
          },
        ],
        featureList: [
          "Multiple collection forms per workspace",
          "Share form via link, embed script, iframe, email, or QR code",
          "Video testimonials",
          "Approval inbox with one-click curation",
          "Unlimited widgets per workspace",
          "5 layouts (Grid, Masonry, Carousel, List, Marquee)",
          "One-line JavaScript embed on any site",
          "Shadow DOM CSS isolation",
          "Custom branding and colors",
          "Multi-currency pricing (USD, INR)",
          "Auto-generated share URLs and QR codes",
        ],
        aggregateRating: undefined, // add once you have reviews
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "Testimoni",
        url: SITE_URL,
        logo: `${SITE_URL}/apple-touch-icon.png`,
        sameAs: [
          "https://x.com/usetestimoni",
          "https://www.linkedin.com/company/144771086",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: SITE_URL,
        name: "Testimoni",
        publisher: { "@id": `${SITE_URL}#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Can I show different testimonials on different pages?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Create one collection form (or many) to collect testimonials. Every approved testimonial lives in one library. Then build separate widgets for your homepage, pricing page, product pages — each widget picks which testimonials to show, and you can use any layout per widget.",
            },
          },
          {
            "@type": "Question",
            name: "How many forms and widgets can I create?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Free plan: 1 collection form, 1 widget, 10 testimonials. Pro plan: unlimited forms and widgets, unlimited testimonials, all layouts.",
            },
          },
          {
            "@type": "Question",
            name: "How do customers find the testimonial form?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Share via 5 channels: direct link, embed script (floating button on your site), iframe (full form on a page you host), email template, or QR code for print materials.",
            },
          },
          {
            "@type": "Question",
            name: "Is there a free plan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The free plan includes 10 testimonials, 1 collection form, 1 widget, and grid layout. No credit card required. Upgrade to Pro at $9/month or ₹499/month for unlimited everything.",
            },
          },
          {
            "@type": "Question",
            name: "Does Testimoni work with Framer, Webflow, Bubble, WordPress, or Shopify?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Testimoni ships a one-line JavaScript embed that works on any website. Shadow DOM isolation ensures zero CSS conflicts with your host site.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
