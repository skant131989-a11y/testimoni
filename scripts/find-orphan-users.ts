import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../src/lib/prisma";

/**
 * Find any Prisma User rows that have no WorkspaceMember — the
 * "half-provisioned" state from the pre-upsert race. These users
 * would show the "something went wrong" error every time they hit
 * /dashboard because the layout's provisioning transaction skips
 * user.create (dbUser exists) but the transaction still fails on
 * something OR the check-your-membership branch is broken.
 *
 * Also lists demo-* users separately so we can tell real users from
 * seed noise.
 */
async function main() {
  const orphans = await prisma.user.findMany({
    where: { workspaceMembers: { none: {} } },
    select: { id: true, email: true, supabaseId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Users without any workspace: ${orphans.length}`);
  for (const u of orphans) {
    const isDemo = u.email.startsWith("demo-") && u.email.endsWith("@testimoni.dev");
    console.log(`  ${isDemo ? "[demo]" : "[real]"} ${u.email} · ${u.supabaseId} · ${u.createdAt.toISOString()}`);
  }
}
main().finally(() => prisma.$disconnect());
