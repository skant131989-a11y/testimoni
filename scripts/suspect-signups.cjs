/**
 * Review (and optionally remove) accounts created by signup bots.
 *
 *   node scripts/suspect-signups.cjs --emails a@x.com,b@y.com            # DRY RUN: shows what each account has
 *   node scripts/suspect-signups.cjs --emails a@x.com,b@y.com --delete   # really deletes them
 *
 * Bots sign up with real people's addresses; the account holders never
 * asked for these. Deleting removes the auth user, the app user, their
 * (empty) workspace and everything in it. It REFUSES to delete an
 * account that has testimonials, widgets beyond the default, or paid
 * subscription activity unless --force is also given. Dry run is the
 * default — nothing is deleted without --delete.
 */
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env.local") });
const { PrismaClient } = require(path.join(ROOT, "node_modules/@prisma/client"));

const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const emails = (opt("--emails") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
const doDelete = args.includes("--delete");
const force = args.includes("--force");
if (!emails.length) { console.error("Pass --emails a@x.com,b@y.com"); process.exit(1); }

(async () => {
  const prisma = new PrismaClient();
  for (const email of emails) {
    const au = (await prisma.$queryRaw`select id::text as id, created_at, last_sign_in_at from auth.users where lower(email) = ${email}`)[0];
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      include: { workspaceMembers: { include: { workspace: { include: { subscription: true, _count: { select: { testimonials: true, widgets: true, forms: true } } } } } } },
    });
    if (!au && !user) { console.log(`${email}: not found`); continue; }
    const ws = user?.workspaceMembers[0]?.workspace;
    const t = ws?._count.testimonials ?? 0, w = ws?._count.widgets ?? 0;
    const paid = ws?.subscription && ws.subscription.plan !== "FREE";
    const risky = t > 0 || w > 1 || paid;
    console.log(`${email}: created ${au?.created_at?.toISOString().slice(0, 16)} | testimonials=${t} widgets=${w} paid=${!!paid} | ${risky ? "HAS ACTIVITY" : "empty"}`);
    if (!doDelete) continue;
    if (risky && !force) { console.log("  -> skipped (has activity; use --force to override)"); continue; }
    if (ws) await prisma.workspace.delete({ where: { id: ws.id } });
    if (user) await prisma.user.delete({ where: { id: user.id } });
    if (au) await prisma.$executeRaw`delete from auth.users where id = ${au.id}::uuid`;
    console.log("  -> deleted");
  }
  if (!doDelete) console.log("\nDRY RUN — nothing was deleted. Add --delete to remove the accounts listed above.");
  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
