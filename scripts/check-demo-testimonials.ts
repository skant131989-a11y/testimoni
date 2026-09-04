import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../src/lib/prisma";

async function main() {
  const demos = await prisma.user.findMany({
    where: { email: { startsWith: "demo-", endsWith: "@testimoni.dev" } },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              testimonials: {
                select: { id: true, content: true, customerName: true, status: true, source: true, createdAt: true },
                orderBy: { createdAt: "desc" },
              },
              forms: {
                include: {
                  submissions: {
                    select: { id: true, content: true, customerName: true, status: true, createdAt: true },
                    orderBy: { createdAt: "desc" },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const u of demos) {
    console.log(`\n=== ${u.email} ===`);
    if (u.workspaceMembers.length === 0) { console.log("  no workspace"); continue; }
    for (const m of u.workspaceMembers) {
      const ws = m.workspace;
      const allSubs = ws.forms.flatMap((f) => f.submissions);
      console.log(`  workspace: ${ws.name}`);
      console.log(`  testimonials: ${ws.testimonials.length}`);
      for (const t of ws.testimonials) {
        console.log(`    [${t.status}] ${t.source} · ${t.customerName}: "${t.content.slice(0, 70)}"`);
      }
      console.log(`  submissions: ${allSubs.length}`);
      for (const s of allSubs) {
        console.log(`    [${s.status}] ${s.customerName}: "${s.content.slice(0, 70)}"`);
      }
    }
  }
}
main().finally(() => prisma.$disconnect());
