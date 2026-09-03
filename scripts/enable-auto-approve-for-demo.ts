import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "../src/lib/prisma";

/**
 * Flip autoApprove=true on every CollectionForm owned by an existing
 * demo-*@testimoni.dev account. Idempotent. Skips users who haven't
 * been provisioned yet (they'll get autoApprove=true automatically
 * on first dashboard visit).
 */
async function main() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: "demo-", endsWith: "@testimoni.dev" } },
    include: {
      workspaceMembers: {
        include: { workspace: { include: { forms: true } } },
      },
    },
  });

  console.log(`Found ${users.length} demo user(s).`);
  let updated = 0;

  for (const u of users) {
    const forms = u.workspaceMembers.flatMap((m) => m.workspace.forms);
    if (forms.length === 0) {
      console.log(`  ${u.email} — no forms yet (not provisioned).`);
      continue;
    }
    for (const f of forms) {
      if (f.autoApprove) {
        console.log(`  ${u.email} — form ${f.slug} already auto-approve.`);
        continue;
      }
      await prisma.collectionForm.update({
        where: { id: f.id },
        data: { autoApprove: true },
      });
      updated += 1;
      console.log(`  ${u.email} — flipped form ${f.slug} → autoApprove.`);
    }
  }

  console.log(`\nDone. ${updated} form(s) updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
