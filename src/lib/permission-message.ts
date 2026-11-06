/**
 * A short, polite message asking the author of a public post whether
 * their praise can be featured. Keeps their name and the link to the
 * original, which is what makes featuring it acceptable to most people.
 */
export const CONSENT_SOURCES = new Set([
  "TWITTER",
  "LINKEDIN",
  "REDDIT",
  "HACKER_NEWS",
  "PRODUCT_HUNT",
  "GOOGLE",
]);

export function permissionMessage({
  source,
  workspaceName,
}: {
  source: string;
  workspaceName: string;
}): string {
  const brand = workspaceName || "our site";
  const ask = `Would you be OK with us featuring it on the ${brand} website? We'd keep your name and a link back to your original post.`;
  switch (source) {
    case "TWITTER":
      return `Thanks so much for the kind words! ${ask} Just reply "yes" and we'll add it.`;
    case "LINKEDIN":
      return `Thank you for sharing this, it really made our day. ${ask} A quick "yes" here is all we need.`;
    case "REDDIT":
      return `Thanks for the kind comment! ${ask} If that's fine, just let us know here.`;
    case "HACKER_NEWS":
      return `Thanks for the generous comment. ${ask} Reply here if that works for you.`;
    case "PRODUCT_HUNT":
      return `Thank you for the review on Product Hunt! ${ask} A quick reply here is all we need.`;
    default:
      return `Thank you for the kind words! ${ask} Just reply "yes" and we'll add it.`;
  }
}
