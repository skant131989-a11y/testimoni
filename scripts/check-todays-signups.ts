import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createAdminClient } from "../src/lib/supabase/admin";
import { prisma } from "../src/lib/prisma";

/**
 * Today-only cross-reference between Supabase auth.users and the
 * app-level users table.
 *
 * Three questions this answers:
 *   1. How many people HIT the signup endpoint today?
 *   2. Of those, how many CONFIRMED their email (clicked link or
 *      typed OTP)?
 *   3. Of the confirmed ones, how many made it into the app's
 *      Prisma users table (i.e. actually landed in /dashboard)?
 *
 * The gap between confirmed and provisioned is the "user got the
 * email, clicked the link, but the callback failed" bucket. If
 * that gap is big, we have a code bug. If confirmed count is
 * ~0 while pending count is huge, users aren't getting the
 * emails OR they're expiring before click.
 */

async function main() {
  const supabase = createAdminClient();

  // Today = midnight local time backwards.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startISO = startOfToday.toISOString();

  // Paginate all users, then filter locally (Supabase admin API
  // doesn't take a date filter).
  let allUsers: Array<{
    id: string;
    email?: string;
    created_at: string;
    email_confirmed_at?: string | null;
  }> = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Supabase admin API error:", error.message);
      process.exit(1);
    }
    if (!data?.users?.length) break;
    allUsers = allUsers.concat(
      data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at,
      })),
    );
    if (data.users.length < perPage) break;
    page += 1;
  }

  const todayUsers = allUsers.filter(
    (u) => new Date(u.created_at).getTime() >= startOfToday.getTime(),
  );

  const confirmed = todayUsers.filter((u) => u.email_confirmed_at);
  const pending = todayUsers.filter((u) => !u.email_confirmed_at);

  // For confirmed users, check if they have a Prisma users row.
  const confirmedSupabaseIds = confirmed.map((u) => u.id);
  const prismaUsers =
    confirmedSupabaseIds.length > 0
      ? await prisma.user.findMany({
          where: { supabaseId: { in: confirmedSupabaseIds } },
          select: { supabaseId: true },
        })
      : [];
  const provisionedIds = new Set(prismaUsers.map((u) => u.supabaseId));

  const confirmedButNoProvision = confirmed.filter(
    (u) => !provisionedIds.has(u.id),
  );

  console.log(`── Today (${startISO.slice(0, 10)}) ──────────────────────────`);
  console.log(`  Total signups (any state):   ${todayUsers.length}`);
  console.log(`  Confirmed (clicked link):    ${confirmed.length}`);
  console.log(`  Pending (waiting):           ${pending.length}`);
  console.log(`  Provisioned in Prisma:       ${provisionedIds.size}`);
  console.log(`  Confirmed but not in Prisma: ${confirmedButNoProvision.length}`);
  console.log("");

  const rate =
    todayUsers.length > 0
      ? (confirmed.length / todayUsers.length) * 100
      : 0;
  console.log(`  Verification rate:           ${rate.toFixed(1)}%`);
  console.log("");

  if (confirmed.length > 0) {
    console.log("── Confirmed users today ──────────────────────────────");
    for (const u of confirmed) {
      const inPrisma = provisionedIds.has(u.id);
      console.log(
        `  ${u.email}  · confirmed ${(u.email_confirmed_at as string).slice(11, 16)}  · prisma: ${inPrisma ? "✅" : "❌"}`,
      );
    }
    console.log("");
  }

  if (pending.length > 0) {
    console.log("── Pending signups today (first 30) ──────────────────");
    for (const u of pending.slice(0, 30)) {
      console.log(`  ${u.email}  · at ${u.created_at.slice(11, 16)}`);
    }
    if (pending.length > 30) console.log(`  … ${pending.length - 30} more`);
    console.log("");
  }

  console.log("── What this tells us ────────────────────────────────");
  if (todayUsers.length === 0) {
    console.log("  Zero signups today. Nothing to diagnose.");
  } else if (confirmed.length === 0) {
    console.log("  ZERO confirmations today — nobody clicked their email link.");
    console.log("  Likely causes:");
    console.log("    1. Emails aren't being delivered (check Supabase Auth Logs)");
    console.log("    2. Emails go to spam");
    console.log("    3. Bot signups (they don't have inbox access)");
    console.log("  Next step: check Supabase Auth Logs for 'email_sent'");
    console.log("    events and their delivery status.");
  } else if (
    confirmedButNoProvision.length > 0 &&
    confirmedButNoProvision.length === confirmed.length
  ) {
    console.log("  Users are confirming, but nobody makes it to /dashboard.");
    console.log("  Likely a Prisma-provisioning bug in dashboard/layout.tsx.");
  } else if (rate < 15) {
    console.log(`  Low verification rate (${rate.toFixed(1)}%) — mix of bots +`);
    console.log("  users who lost their email. Add Turnstile + shorter OTP TTL.");
  } else {
    console.log(`  Verification rate ${rate.toFixed(1)}% is in the normal range.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
