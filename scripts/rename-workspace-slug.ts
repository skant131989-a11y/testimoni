import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../src/lib/prisma";

/**
 * Rename a workspace's slug.
 *
 * Usage:
 *   npx tsx scripts/rename-workspace-slug.ts <fromSlug> <toSlug>
 *
 * Changes the workspace's URL segment for both the collect form
 * (/collect/<slug>/<form>) and the public wall (/w/<slug>).
 * Does not affect internal ids or any embedded widgets already
 * on customers' sites (those are keyed by widgetId, not slug).
 */
async function main() {
  const [, , fromSlug, toSlug] = process.argv;
  if (!fromSlug || !toSlug) {
    console.error("usage: tsx scripts/rename-workspace-slug.ts <from> <to>");
    process.exit(1);
  }

  const existing = await prisma.workspace.findUnique({ where: { slug: fromSlug } });
  if (!existing) {
    console.error(`no workspace with slug "${fromSlug}"`);
    process.exit(1);
  }

  const clash = await prisma.workspace.findUnique({ where: { slug: toSlug } });
  if (clash) {
    console.error(`slug "${toSlug}" already taken by workspace ${clash.id}`);
    process.exit(1);
  }

  const updated = await prisma.workspace.update({
    where: { id: existing.id },
    data: { slug: toSlug },
  });

  console.log(`renamed: ${fromSlug} -> ${toSlug} (workspace ${updated.id})`);
  console.log(`  collect URLs now start with: /collect/${toSlug}/...`);
  console.log(`  wall URL now: /w/${toSlug}`);
}

main().finally(() => prisma.$disconnect());
