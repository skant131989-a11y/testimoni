import { prisma } from "../src/lib/prisma";
import { sanitizeImportedText } from "../src/lib/sanitize-imported-text";

/**
 * One-off cleanup: re-run the imported-text sanitizer over any
 * testimonial whose content still contains Twitter's t.co /
 * pic.twitter.com noise. Applies the same rules new imports now
 * go through, so previously-imported tweets stop showing raw
 * short links + media appendages on the Wall of Love.
 *
 * Idempotent — running it twice is a no-op. Prints a before/after
 * diff for each row it touches.
 *
 * Run: pnpm tsx scripts/clean-imported-testimonials.ts
 */

const NOISE_PATTERN = /https?:\/\/t\.co\/|pic\.(?:twitter|x)\.com\//i;

async function main() {
  const candidates = await prisma.testimonial.findMany({
    where: {
      OR: [
        { content: { contains: "t.co/" } },
        { content: { contains: "pic.twitter.com/" } },
        { content: { contains: "pic.x.com/" } },
      ],
    },
    select: { id: true, content: true, customerName: true, source: true },
  });

  console.log(`Found ${candidates.length} candidate testimonial(s) with import noise.\n`);

  let updated = 0;
  for (const t of candidates) {
    const original = t.content ?? "";
    if (!NOISE_PATTERN.test(original)) continue;

    const cleaned = sanitizeImportedText(original);
    if (cleaned === original) continue;

    console.log(`=== ${t.id} (${t.source} · ${t.customerName})`);
    console.log(`  before: ${JSON.stringify(original)}`);
    console.log(`  after:  ${JSON.stringify(cleaned)}\n`);

    await prisma.testimonial.update({
      where: { id: t.id },
      data: { content: cleaned },
    });
    updated++;
  }

  console.log(`\nDone. Updated ${updated} testimonial(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
