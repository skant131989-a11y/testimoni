import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createAdminClient } from "../src/lib/supabase/admin";
import { prisma } from "../src/lib/prisma";

/**
 * Find bot signups and (optionally) delete them.
 *
 *   npx tsx scripts/cleanup-bot-signups.ts              # dry run — shows matches only
 *   npx tsx scripts/cleanup-bot-signups.ts --confirm    # actually delete
 *   npx tsx scripts/cleanup-bot-signups.ts --days 3     # limit window to last N days
 *
 * A "bot signup" here is anyone where ALL of these hold:
 *   1. Account created in the last N days (default 7)
 *   2. last_sign_in_at is within 60s of created_at (never came back)
 *   3. Zero testimonials, submissions, and wall-score runs on their
 *      workspace(s) — the workspace-provisioning defaults (1 widget,
 *      1 form) are ignored because they're auto-created, not user actions.
 *
 * The auto-created widget/form check is the reason we run the full
 * activity query — an account with the default seeded resources but
 * no actual usage is indistinguishable from an unused shell.
 *
 * ── Delete order ──────────────────────────────────────────────────
 *   Prisma:  testimonials → widget-testimonials → widgets → forms
 *            → submissions → wall-score-audits → subscription
 *            → askMyWall → socialAccounts → reviewSources
 *            → workspaceMembers → workspace → user
 *   Supabase: auth.users
 *
 * We wrap Prisma writes per-user in a $transaction so a mid-delete
 * failure doesn't leave a half-deleted account.
 */

interface Args {
  confirm: boolean;
  days: number;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const confirm = args.includes("--confirm");
  const daysIdx = args.indexOf("--days");
  const days =
    daysIdx >= 0 && args[daysIdx + 1] ? Number(args[daysIdx + 1]) : 7;
  return { confirm, days: Number.isFinite(days) && days > 0 ? days : 7 };
}

async function main() {
  const { confirm, days } = parseArgs();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY is missing — check .env.local (Supabase → Settings → API → service_role).",
    );
    process.exit(1);
  }

  const supabase = createAdminClient();

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  process.stdout.write(
    `\nScanning signups since ${cutoff.toISOString()} for bot patterns…\n`,
  );

  // Page through Supabase users; admin API doesn't take a filter.
  const allUsers: Array<{
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string | null;
  }> = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    process.stdout.write(`Fetching Supabase users page ${page}…\n`);
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("Supabase admin API error:", error.message);
      process.exit(1);
    }
    if (!data?.users?.length) break;
    for (const u of data.users) {
      allUsers.push({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      });
    }
    if (data.users.length < perPage) break;
    page += 1;
    // Small safety cap.
    if (page > 50) break;
  }
  process.stdout.write(`Fetched ${allUsers.length} users total.\n`);

  // Filter to recent + zero-activity candidates.
  const candidates = allUsers.filter((u) => {
    if (new Date(u.created_at) < cutoff) return false;
    // last_sign_in_at within 60s of created_at = never returned
    const createdMs = new Date(u.created_at).getTime();
    const lastMs = u.last_sign_in_at
      ? new Date(u.last_sign_in_at).getTime()
      : createdMs;
    return Math.abs(lastMs - createdMs) < 60_000;
  });

  process.stdout.write(
    `Recent + never-returned signups: ${candidates.length} (of ${allUsers.length} total users)\n`,
  );

  // Batched fetch — pull all Prisma users + their workspaces in one query.
  const candidateSupabaseIds = candidates.map((c) => c.id);
  process.stdout.write(
    `Fetching ${candidateSupabaseIds.length} Prisma users in one query…\n`,
  );
  const dbUsers = await prisma.user.findMany({
    where: { supabaseId: { in: candidateSupabaseIds } },
    include: { workspaceMembers: true },
  });
  const dbUserBySupabaseId = new Map(
    dbUsers.map((u) => [u.supabaseId, u]),
  );
  const allWorkspaceIds = dbUsers.flatMap((u) =>
    u.workspaceMembers.map((m) => m.workspaceId),
  );
  process.stdout.write(
    `Found ${dbUsers.length} matching Prisma users across ${allWorkspaceIds.length} workspaces.\n`,
  );

  // Fetch activity per workspace in three big queries.
  process.stdout.write("Counting activity per workspace…\n");
  const [
    testimonialCounts,
    submissionCounts,
    wallScoreCounts,
  ] = await Promise.all([
    prisma.testimonial.groupBy({
      by: ["workspaceId"],
      where: { workspaceId: { in: allWorkspaceIds } },
      _count: { _all: true },
    }),
    prisma.submission.groupBy({
      by: ["formId"],
      where: { form: { workspaceId: { in: allWorkspaceIds } } },
      _count: { _all: true },
    }),
    prisma.wallScoreAudit.groupBy({
      by: ["workspaceId"],
      where: { workspaceId: { in: allWorkspaceIds } },
      _count: { _all: true },
    }),
  ]);

  const testimonialsByWs = new Map(
    testimonialCounts.map((r) => [r.workspaceId, r._count._all]),
  );
  const auditsByWs = new Map(
    wallScoreCounts.map((r) => [r.workspaceId, r._count._all]),
  );
  // Submissions link to formId not workspaceId directly — but any submission
  // means the workspace has real activity. We only need to know: does this
  // workspace have ANY submissions? Sum all form submission counts.
  const formIdToWorkspace = await prisma.collectionForm.findMany({
    where: { workspaceId: { in: allWorkspaceIds } },
    select: { id: true, workspaceId: true },
  });
  const submissionsByWs = new Map<string, number>();
  for (const row of submissionCounts) {
    const wsId = formIdToWorkspace.find((f) => f.id === row.formId)?.workspaceId;
    if (wsId) {
      submissionsByWs.set(
        wsId,
        (submissionsByWs.get(wsId) ?? 0) + row._count._all,
      );
    }
  }

  // Safety allowlist — never delete these emails, even if they meet
  // all bot criteria. Founder test accounts + specific real users.
  const NEVER_DELETE = new Set(
    (process.env.NEVER_DELETE_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  const NEVER_DELETE_DOMAINS = ["testimoni.io"]; // your own tests

  const bots: Array<{
    supabaseId: string;
    email: string;
    userId?: string;
    workspaceIds: string[];
  }> = [];
  const skipped: string[] = [];
  for (const u of candidates) {
    const emailLc = (u.email ?? "").toLowerCase();
    const domain = emailLc.split("@")[1] ?? "";
    if (NEVER_DELETE.has(emailLc) || NEVER_DELETE_DOMAINS.includes(domain)) {
      skipped.push(u.email ?? u.id);
      continue;
    }
    const dbUser = dbUserBySupabaseId.get(u.id);
    if (!dbUser) {
      // Supabase-only shell (never got past Prisma provisioning).
      bots.push({
        supabaseId: u.id,
        email: u.email ?? "?",
        workspaceIds: [],
      });
      continue;
    }
    const workspaceIds = dbUser.workspaceMembers.map((m) => m.workspaceId);
    const hasAnyActivity = workspaceIds.some(
      (wsId) =>
        (testimonialsByWs.get(wsId) ?? 0) > 0 ||
        (submissionsByWs.get(wsId) ?? 0) > 0 ||
        (auditsByWs.get(wsId) ?? 0) > 0,
    );
    if (!hasAnyActivity) {
      bots.push({
        supabaseId: u.id,
        email: u.email ?? "?",
        userId: dbUser.id,
        workspaceIds,
      });
    }
  }

  if (skipped.length > 0) {
    console.log(
      `\n── Protected by allowlist (${skipped.length}) ──`,
    );
    for (const s of skipped) console.log(`  ${s}`);
  }

  console.log(`── Bot candidates (${bots.length}) ──`);
  for (const b of bots) {
    console.log(
      `  ${b.email.padEnd(48)} sb:${b.supabaseId.slice(0, 8)}…  ws:${b.workspaceIds.length}`,
    );
  }
  console.log("");

  if (!confirm) {
    console.log(
      "Dry run — no deletes performed. Re-run with --confirm to delete.",
    );
    return;
  }

  if (bots.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  console.log(`Deleting ${bots.length} accounts…\n`);
  let ok = 0;
  let failed = 0;
  for (const bot of bots) {
    try {
      // Prisma-side cleanup — do it in a transaction per bot so a
      // failure on one row doesn't cascade a partial delete.
      if (bot.userId && bot.workspaceIds.length > 0) {
        await prisma.$transaction(async (tx) => {
          const workspaceIds = bot.workspaceIds;
          await tx.testimonial.deleteMany({
            where: { workspaceId: { in: workspaceIds } },
          });
          await tx.widget.deleteMany({
            where: { workspaceId: { in: workspaceIds } },
          });
          await tx.submission.deleteMany({
            where: { form: { workspaceId: { in: workspaceIds } } },
          });
          await tx.collectionForm.deleteMany({
            where: { workspaceId: { in: workspaceIds } },
          });
          await tx.wallScoreAudit.deleteMany({
            where: { workspaceId: { in: workspaceIds } },
          });
          await tx.subscription.deleteMany({
            where: { workspaceId: { in: workspaceIds } },
          });
          await tx.askMyWallConfig.deleteMany({
            where: { workspaceId: { in: workspaceIds } },
          });
          await tx.socialAccount.deleteMany({
            where: { workspaceId: { in: workspaceIds } },
          });
          await tx.reviewSource.deleteMany({
            where: { workspaceId: { in: workspaceIds } },
          });
          await tx.workspaceMember.deleteMany({
            where: { workspaceId: { in: workspaceIds } },
          });
          await tx.workspace.deleteMany({
            where: { id: { in: workspaceIds } },
          });
          await tx.user.delete({ where: { id: bot.userId! } });
        });
      } else if (bot.userId) {
        // User row without workspace — rare, but delete cleanly.
        await prisma.user.delete({ where: { id: bot.userId } });
      }
      // Supabase-side delete.
      const { error } = await supabase.auth.admin.deleteUser(bot.supabaseId);
      if (error) throw new Error(`Supabase: ${error.message}`);
      console.log(`  ✅ ${bot.email}`);
      ok += 1;
    } catch (err) {
      console.error(
        `  ❌ ${bot.email} — ${err instanceof Error ? err.message : String(err)}`,
      );
      failed += 1;
    }
  }

  console.log(`\nDone. ${ok} deleted, ${failed} failed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
