import { prisma } from "../src/lib/prisma";
import { fetchTweetViaSyndication } from "../src/lib/twitter-syndication";

/**
 * Re-import all TWITTER-source testimonials through the new syndication
 * API path so:
 *   - Full tweets (≤280 chars) no longer carry oEmbed's misleading "…"
 *   - Long "note tweets" get an explicit "…" appended (the only signal
 *     to readers that more text lives on X)
 *   - Customer avatars get backfilled (syndication returns
 *     profile_image_url_https; the old oEmbed path didn't)
 *
 * Idempotent — running twice produces the same result.
 *
 * Run: pnpm tsx scripts/reimport-tweets-via-syndication.ts
 */

async function main() {
  const tweets = await prisma.testimonial.findMany({
    where: { source: "TWITTER" },
    select: {
      id: true,
      content: true,
      customerName: true,
      customerAvatar: true,
      customerUrl: true,
      sourceUrl: true,
    },
  });

  console.log(`Re-importing ${tweets.length} TWITTER testimonial(s)…\n`);

  let updated = 0;
  for (const t of tweets) {
    if (!t.sourceUrl) continue;

    const fresh = await fetchTweetViaSyndication(t.sourceUrl);
    if (!fresh || !fresh.content) {
      console.log(`  [skip] ${t.id} — syndication fetch failed`);
      continue;
    }

    const newContent = fresh.truncated ? `${fresh.content}…` : fresh.content;

    const changes: Record<string, unknown> = {};
    if (newContent !== t.content) changes.content = newContent;
    if (fresh.authorAvatarUrl && !t.customerAvatar)
      changes.customerAvatar = fresh.authorAvatarUrl;
    if (fresh.authorProfileUrl && t.customerUrl !== fresh.authorProfileUrl)
      changes.customerUrl = fresh.authorProfileUrl;

    if (Object.keys(changes).length === 0) continue;

    console.log(`=== ${t.id} (${t.customerName})`);
    for (const [k, v] of Object.entries(changes)) {
      console.log(`  ${k}:`);
      console.log(`    before: ${JSON.stringify((t as Record<string, unknown>)[k])}`);
      console.log(`    after:  ${JSON.stringify(v)}`);
    }
    console.log("");

    await prisma.testimonial.update({ where: { id: t.id }, data: changes });
    updated++;
  }

  console.log(`\nDone. Updated ${updated} testimonial(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
