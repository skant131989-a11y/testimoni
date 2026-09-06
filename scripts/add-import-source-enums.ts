import { prisma } from "../src/lib/prisma";

/**
 * Non-destructive migration: add REDDIT / HACKER_NEWS / PRODUCT_HUNT
 * values to the TestimonialSource enum. Prisma's migrate-dev refuses
 * to touch this DB because it detects unrelated drift with existing
 * migration history; a direct ALTER TYPE is the smallest safe change.
 * Idempotent — IF NOT EXISTS guards each ADD VALUE.
 */
async function main() {
  console.log("Adding new enum values to TestimonialSource…");
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "TestimonialSource" ADD VALUE IF NOT EXISTS 'REDDIT'`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "TestimonialSource" ADD VALUE IF NOT EXISTS 'HACKER_NEWS'`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "TestimonialSource" ADD VALUE IF NOT EXISTS 'PRODUCT_HUNT'`
  );
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
