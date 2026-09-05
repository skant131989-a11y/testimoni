import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../src/lib/prisma";
async function main() {
  const id = process.argv[2];
  if (!id) { console.error("usage: tsx scripts/find-form-by-id.ts <formId>"); process.exit(1); }
  const form = await prisma.collectionForm.findUnique({
    where: { id },
    select: { id: true, slug: true, isActive: true, workspace: { select: { slug: true, name: true } } },
  });
  console.log(JSON.stringify(form, null, 2));
}
main().finally(() => prisma.$disconnect());
