import { prisma } from "../src/lib/prisma";

/**
 * Dry-run: list every user whose name contains "test" or "shashi"
 * (case-insensitive), along with what would cascade if we deleted
 * them. Prints ONLY — no deletes. Actual deletion is a separate
 * pass gated on user confirmation.
 */
async function main() {
  const matches = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: "test", mode: "insensitive" } },
        { name: { contains: "shashi", mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              _count: {
                select: {
                  testimonials: true,
                  widgets: true,
                  forms: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (matches.length === 0) {
    console.log("No matching users. Nothing to delete.");
    return;
  }

  console.log(`\n${matches.length} matching user${matches.length === 1 ? "" : "s"}:\n`);
  console.log(
    "USER ID".padEnd(28),
    "NAME".padEnd(24),
    "EMAIL".padEnd(38),
    "WSPACE".padEnd(16),
    "T/W/F"
  );
  console.log("─".repeat(120));
  for (const u of matches) {
    const ws = u.workspaceMembers[0]?.workspace;
    const counts = ws
      ? `${ws._count.testimonials}/${ws._count.widgets}/${ws._count.forms}`
      : "—";
    console.log(
      u.id.padEnd(28),
      (u.name || "?").slice(0, 23).padEnd(24),
      u.email.slice(0, 37).padEnd(38),
      (ws?.slug || "—").slice(0, 15).padEnd(16),
      counts
    );
  }
  console.log("─".repeat(120));
  console.log("T = testimonials, W = widgets, F = forms\n");

  // Also collect the workspace IDs we'd need to cascade-delete
  // (workspaces themselves are NOT cascaded from user delete — only
  // WorkspaceMember rows are).
  const workspaceIds = matches
    .flatMap((u) => u.workspaceMembers.map((m) => m.workspace.id))
    .filter((v, i, a) => a.indexOf(v) === i);

  console.log(
    `Cascade preview: ${matches.length} User + ${workspaceIds.length} Workspace rows (+ all child testimonials, widgets, forms, subscription, WidgetTestimonial links, WidgetAnalytics)\n`
  );
  console.log("To actually delete, run the same script with --confirm flag.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
