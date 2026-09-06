import { prisma } from "../src/lib/prisma";
import { sanitizeImportedText } from "../src/lib/sanitize-imported-text";

/**
 * Re-hydrate existing TWITTER-source testimonials that were stripped of
 * their trailing "…" by an earlier over-aggressive sanitizer pass. Now
 * that the sanitizer preserves the ellipsis, re-fetch oEmbed for each
 * tweet and rewrite the DB content — the "…" is Twitter's only signal
 * that the tweet was truncated, and readers of the Wall of Love need
 * it to know the sentence is not just broken.
 *
 * Idempotent — re-running produces the same content.
 *
 * Run: pnpm tsx scripts/rehydrate-truncated-tweets.ts
 */

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const candidates = await prisma.testimonial.findMany({
    where: { source: "TWITTER" },
    select: { id: true, content: true, customerName: true, sourceUrl: true },
  });

  console.log(`Scanning ${candidates.length} TWITTER testimonial(s)…\n`);

  let updated = 0;
  for (const t of candidates) {
    if (!t.sourceUrl) continue;

    const oembed = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
      t.sourceUrl
    )}&omit_script=1&hide_thread=1`;
    const res = await fetch(oembed, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.log(`  [skip] ${t.id} oembed ${res.status}`);
      continue;
    }
    const data = (await res.json()) as { html?: string };
    const html = data.html || "";
    const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const raw = pMatch ? stripHtml(pMatch[1]) : stripHtml(html);
    const cleaned = sanitizeImportedText(raw);

    if (!cleaned || cleaned === t.content) continue;

    console.log(`=== ${t.id} (${t.customerName})`);
    console.log(`  before: ${JSON.stringify(t.content)}`);
    console.log(`  after:  ${JSON.stringify(cleaned)}\n`);

    await prisma.testimonial.update({
      where: { id: t.id },
      data: { content: cleaned },
    });
    updated++;
  }

  console.log(`\nDone. Rehydrated ${updated} testimonial(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
