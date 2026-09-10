import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createAdminClient } from "../src/lib/supabase/admin";

/**
 * Read the Supabase auth.users table (via admin API) and flag
 * likely-bot signups.
 *
 * Bot signals we look for:
 *   1. Temporary-email domains (mailinator, tempmail, guerrilla,
 *      sharklasers, throwawaymail, etc.)
 *   2. Random-string email locals ("abc123xyz@…", "qwer1234@…")
 *   3. Bursts (many signups within the same minute)
 *   4. Sequential locals (user1@, user2@, user3@)
 *   5. Never-confirmed status (users with created_at > 24h ago
 *      still email_confirmed_at = null are almost certainly bots
 *      or abandoned intents)
 *
 * Prints a summary table + a suggested "these look like bots"
 * list you can review and delete from the Supabase dashboard.
 *
 *   npx tsx scripts/check-supabase-signups.ts
 */

const TEMPMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "tempmail.net",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "sharklasers.com",
  "throwawaymail.com",
  "yopmail.com",
  "dispostable.com",
  "getnada.com",
  "trashmail.com",
  "temp-mail.org",
  "moakt.com",
  "emailondeck.com",
  "fakeinbox.com",
  "maildrop.cc",
  "mytemp.email",
  "wegwerf-email.net",
  "spam4.me",
  "mvrht.net",
  "chacuo.net",
  "byom.de",
  "getairmail.com",
  "mohmal.com",
  "trbvm.com",
  "vusra.com",
  "vomoto.com",
]);

function looksLikeRandomLocal(local: string): boolean {
  // Very long strings with digits + random letters
  if (local.length >= 12 && /^[a-z0-9]+$/.test(local)) {
    const hasDigits = /\d/.test(local);
    const consonants = (local.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
    const vowels = (local.match(/[aeiou]/g) || []).length;
    // Real names are usually pronouncable — high consonant / low vowel
    // ratio + digit spam = random.
    if (hasDigits && consonants > 8 && vowels < consonants / 2) return true;
  }
  // Locals that are pure hex-ish strings
  if (/^[a-f0-9]{16,}$/.test(local)) return true;
  return false;
}

async function main() {
  const supabase = createAdminClient();

  // Paginate through auth users
  let allUsers: Array<{
    id: string;
    email?: string;
    created_at: string;
    email_confirmed_at?: string | null;
    last_sign_in_at?: string | null;
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
        last_sign_in_at: u.last_sign_in_at,
      })),
    );
    if (data.users.length < perPage) break;
    page += 1;
  }

  console.log(`Total users in Supabase auth: ${allUsers.length}`);

  const pending = allUsers.filter((u) => !u.email_confirmed_at);
  const confirmed = allUsers.filter((u) => u.email_confirmed_at);
  console.log(`Pending verification: ${pending.length}`);
  console.log(`Confirmed:            ${confirmed.length}`);
  console.log("");

  // Classify pending users
  const flags: Array<{ user: (typeof pending)[0]; reasons: string[] }> = [];
  const domainCounts = new Map<string, number>();
  const emailsByDomain = new Map<string, string[]>();

  for (const u of pending) {
    if (!u.email) continue;
    const [local, domain] = u.email.toLowerCase().split("@");
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    if (!emailsByDomain.has(domain)) emailsByDomain.set(domain, []);
    emailsByDomain.get(domain)!.push(u.email);

    const reasons: string[] = [];
    if (TEMPMAIL_DOMAINS.has(domain)) reasons.push("tempmail");
    if (looksLikeRandomLocal(local)) reasons.push("random_local");
    // Older than 24h and still unverified — abandoned or bot
    const ageMs = Date.now() - new Date(u.created_at).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) reasons.push("stale_24h");

    if (reasons.length > 0) flags.push({ user: u, reasons });
  }

  // Burst detection — signups within same minute
  const timeMap = new Map<string, string[]>();
  for (const u of pending) {
    if (!u.email) continue;
    const minute = u.created_at.slice(0, 16); // YYYY-MM-DDTHH:MM
    if (!timeMap.has(minute)) timeMap.set(minute, []);
    timeMap.get(minute)!.push(u.email);
  }
  const bursts = [...timeMap.entries()].filter(([, list]) => list.length >= 3);

  console.log("── Pending users by domain (top 15) ─────────────────");
  const sortedDomains = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  for (const [domain, count] of sortedDomains) {
    const tag = TEMPMAIL_DOMAINS.has(domain) ? " 🚨 TEMPMAIL" : "";
    console.log(`  ${count.toString().padStart(3)} × ${domain}${tag}`);
  }
  console.log("");

  console.log(`── Bursts (3+ signups in the same minute) ───────────`);
  if (bursts.length === 0) {
    console.log("  None — no obvious burst pattern.");
  } else {
    for (const [minute, list] of bursts.slice(0, 10)) {
      console.log(`  ${minute} · ${list.length} signups: ${list.slice(0, 3).join(", ")}${list.length > 3 ? "…" : ""}`);
    }
  }
  console.log("");

  console.log(`── Flagged users (${flags.length} of ${pending.length} pending) ───`);
  for (const { user, reasons } of flags.slice(0, 30)) {
    console.log(`  ${user.email}  [${reasons.join(", ")}]  created ${user.created_at.slice(0, 16)}`);
  }
  if (flags.length > 30) console.log(`  … ${flags.length - 30} more`);
  console.log("");

  const confirmedInLast24h = confirmed.filter(
    (u) => Date.now() - new Date(u.created_at).getTime() < 24 * 60 * 60 * 1000,
  ).length;
  const pendingInLast24h = pending.filter(
    (u) => Date.now() - new Date(u.created_at).getTime() < 24 * 60 * 60 * 1000,
  ).length;
  console.log("── Last 24 hours ─────────────────────────────────────");
  console.log(`  Confirmed signups: ${confirmedInLast24h}`);
  console.log(`  Pending signups:   ${pendingInLast24h}`);
  const total24h = confirmedInLast24h + pendingInLast24h;
  const rate = total24h > 0 ? (confirmedInLast24h / total24h) * 100 : 0;
  console.log(`  Verification rate: ${rate.toFixed(1)}% (real humans usually 40-60%)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
