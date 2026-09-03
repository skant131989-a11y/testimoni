import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../src/lib/prisma";

async function main() {
  const demos = await prisma.user.findMany({
    where: { email: { startsWith: "demo-", endsWith: "@testimoni.dev" } },
    include: { workspaceMembers: { include: { workspace: true } } },
  });
  for (const u of demos) {
    console.log(u.email, "supabaseId=" + u.supabaseId, "workspaces=" + u.workspaceMembers.length);
  }
}
main().finally(() => prisma.$disconnect());
