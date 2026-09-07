import { prisma } from "../src/lib/prisma";

/**
 * Non-destructive migration for the founder directory foundation.
 * Adds public_listing / pitch / website_url / x_handle to workspaces
 * + the public_listing index. Idempotent — IF NOT EXISTS on every
 * column so re-runs are safe.
 */

async function main() {
  console.log("Adding founder-directory columns to workspaces…");
  await prisma.$executeRawUnsafe(
    `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS public_listing BOOLEAN NOT NULL DEFAULT false`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS pitch VARCHAR(240)`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS website_url VARCHAR(400)`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS x_handle VARCHAR(60)`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS workspaces_public_listing_idx ON workspaces(public_listing)`
  );
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
