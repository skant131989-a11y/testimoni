import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "../src/lib/prisma";

/**
 * Adds `auto_approve` column to collection_forms without running
 * prisma migrate (which wanted a full DB reset due to migration
 * history drift). Idempotent: uses IF NOT EXISTS.
 */
async function main() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "collection_forms" ADD COLUMN IF NOT EXISTS "auto_approve" BOOLEAN NOT NULL DEFAULT false;`
  );
  console.log("✓ collection_forms.auto_approve column ensured.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
