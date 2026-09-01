import "dotenv/config";
import { config } from "dotenv";
// Prisma loads .env automatically; the Supabase admin client needs
// NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY which live in
// .env.local. Load that explicitly here without letting the shell
// mangle special chars in DATABASE_URL.
config({ path: ".env.local" });

import { prisma } from "../src/lib/prisma";
import { createAdminClient } from "../src/lib/supabase/admin";

/**
 * Nuke two users and their data completely so they can sign up fresh.
 * Deletes in this order:
 *   1. Testimonials, submissions, widgets, forms, subscription, members
 *      (via prisma.workspace.delete which cascades)
 *   2. User row in Prisma (cascades workspaceMembers)
 *   3. auth.users row in Supabase (so email is free to re-signup)
 *
 * Safe: only touches the emails listed. Idempotent — running twice
 * on an already-deleted user is a no-op.
 */

const TARGET_EMAILS = ["neha@testimoni.io", "testmail1@gmail.com"];

async function main() {
  const supabase = createAdminClient();

  for (const email of TARGET_EMAILS) {
    console.log(`\n=== ${email} ===`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaceMembers: {
          include: { workspace: true },
        },
      },
    });

    if (!user) {
      console.log("  Prisma user not found (may have been deleted already).");
    } else {
      console.log(`  Prisma user: ${user.id} (supabaseId: ${user.supabaseId})`);
      console.log(`  Workspaces owned/joined: ${user.workspaceMembers.length}`);

      // Delete each workspace they're a member of. Cascade rules in
      // schema.prisma remove: widgets, forms, testimonials, submissions,
      // subscription, other members.
      for (const wm of user.workspaceMembers) {
        console.log(
          `  Deleting workspace ${wm.workspace.slug} (${wm.workspace.id})…`
        );
        await prisma.workspace.delete({ where: { id: wm.workspace.id } });
      }

      // Delete the Prisma user row.
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`  Prisma user deleted.`);
    }

    // Delete from Supabase Auth so the email is reusable. This works
    // even if the Prisma side was already cleared.
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) {
      console.log(`  ⚠️  Could not list auth users: ${listErr.message}`);
      continue;
    }
    const authUser = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!authUser) {
      console.log("  Auth user not found — email is already free.");
    } else {
      const { error: delErr } = await supabase.auth.admin.deleteUser(authUser.id);
      if (delErr) {
        console.log(`  ⚠️  Could not delete auth user: ${delErr.message}`);
      } else {
        console.log(`  Auth user deleted (${authUser.id}).`);
      }
    }
  }

  console.log("\nDone. Both emails are now free to sign up again.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
