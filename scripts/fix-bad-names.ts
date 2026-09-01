import { prisma } from "../src/lib/prisma";
import { looksLikeGeneratedPassword, safeDisplayName } from "../src/lib/name-utils";

/**
 * One-off cleanup: fix bad names on two specific accounts and their
 * workspaces. Password-manager autofill (uHbGb...-style) stored a
 * generated password in the Name field at signup. Replaces the name
 * with the Title-Cased email local-part.
 *
 * Runs safely — logs before + after for each row and skips if the
 * name doesn't look like garbage.
 */

const TARGET_EMAILS = [
  "abird-vittek@comcast.net",
  "t.el.u.qij.u.s.i.m.i05@gmail.com",
];

async function main() {
  for (const email of TARGET_EMAILS) {
    console.log(`\n=== ${email} ===`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaceMembers: {
          include: {
            workspace: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!user) {
      console.log(`  ⚠️  User not found — skipping.`);
      continue;
    }

    console.log(`  User.name (before): ${JSON.stringify(user.name)}`);
    const workspace = user.workspaceMembers[0]?.workspace;
    console.log(`  Workspace.name (before): ${JSON.stringify(workspace?.name)}`);

    const cleanName = safeDisplayName(user.name, user.email);
    const cleanWorkspace = `${cleanName}'s Workspace`;

    if (user.name === cleanName && workspace?.name === cleanWorkspace) {
      console.log(`  ✓  Already clean — no update needed.`);
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { name: cleanName },
    });
    console.log(`  User.name (after):  ${JSON.stringify(cleanName)}`);

    if (workspace) {
      // Only rename the workspace if the current name looks like the
      // "garbage's Workspace" pattern. Preserves any custom names the
      // user may have set manually later.
      const originalPrefix = workspace.name.replace(/'s Workspace$/, "");
      if (looksLikeGeneratedPassword(originalPrefix)) {
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: { name: cleanWorkspace },
        });
        console.log(`  Workspace.name (after): ${JSON.stringify(cleanWorkspace)}`);
      } else {
        console.log(
          `  Workspace name not garbage-shaped, leaving as-is: ${JSON.stringify(workspace.name)}`
        );
      }
    }
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
