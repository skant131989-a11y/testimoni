/**
 * schema.org review markup (JSON-LD) for a wall of testimonials. Search
 * engines and AI assistants read this to understand what customers said
 * about a product, even when the wall itself is drawn by JavaScript.
 *
 * public/embed/widget.js has a small copy of this logic for embedded
 * walls; keep the two in step.
 */

type SchemaTestimonial = {
  customerName: string;
  content: string | null;
  rating: number | null;
  createdAt?: Date | string | null;
};

export function buildReviewSchema({
  name,
  url,
  testimonials,
}: {
  name: string;
  url?: string | null;
  testimonials: SchemaTestimonial[];
}): Record<string, unknown> | null {
  const withText = testimonials.filter((t) => t.content && t.content.trim());
  if (withText.length === 0) return null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(url ? { url } : {}),
    review: withText.slice(0, 20).map((t) => ({
      "@type": "Review",
      author: { "@type": "Person", name: t.customerName },
      reviewBody: t.content,
      ...(t.rating && t.rating > 0
        ? { reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5 } }
        : {}),
      ...(t.createdAt ? { datePublished: new Date(t.createdAt).toISOString().slice(0, 10) } : {}),
    })),
  };

  const rated = withText.filter((t) => t.rating && t.rating > 0);
  if (rated.length > 0) {
    const avg = rated.reduce((sum, t) => sum + (t.rating as number), 0) / rated.length;
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Math.round(avg * 10) / 10,
      reviewCount: rated.length,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return schema;
}

/** JSON for inside a <script type="application/ld+json"> tag (no "</script>" escapes). */
export function schemaToScriptJson(schema: Record<string, unknown>): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
