import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { randomBytes } from "node:crypto";
import { createAdminClient } from "../src/lib/supabase/admin";

/**
 * Create N pre-confirmed Supabase auth users so you can hand out
 * ready-to-log-in demo accounts. Skips the confirm-email step by
 * setting email_confirm=true via the admin API.
 *
 * The rest of the account (workspace, subscription row, default
 * form + widget) is provisioned automatically the first time the
 * user visits /dashboard — the layout's existing bootstrap handles
 * it — so this script only needs to create the auth row.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-users.ts        # 5 users, default
 *   npx tsx scripts/seed-demo-users.ts 10     # 10 users
 *
 * WARNING: only run against a dev Supabase project. Do NOT point
 * SUPABASE_URL at prod when running this.
 */

function randomEmail(): string {
  const slug = randomBytes(4).toString("hex");
  return `demo-${slug}@testimoni.dev`;
}

function randomPassword(): string {
  // 12 chars, mixed alnum. Enough entropy for demo accounts, easy to
  // read/type in a share doc.
  return randomBytes(9).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
}

async function main() {
  const count = parseInt(process.argv[2] || "5", 10);
  if (isNaN(count) || count < 1 || count > 100) {
    console.error("Provide a count between 1 and 100.");
    process.exit(1);
  }

  const supabase = createAdminClient();
  const created: { email: string; password: string }[] = [];

  for (let i = 0; i < count; i++) {
    const email = randomEmail();
    const password = randomPassword();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: "seed_script" },
    });

    if (error) {
      console.error(`✗ ${email}: ${error.message}`);
      continue;
    }
    created.push({ email, password });
    console.log(`✓ ${email} (id: ${data.user?.id})`);
  }

  console.log("\n=== Demo credentials ===");
  console.log("email,password");
  for (const c of created) {
    console.log(`${c.email},${c.password}`);
  }
  console.log(
    `\nCreated ${created.length}/${count} demo users. They can log in at /login immediately.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
