import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createAdminClient } from "../src/lib/supabase/admin";
import { prisma } from "../src/lib/prisma";

/**
 * For each email supplied on the command line (or in EMAILS below),
 * pull the full activity picture:
 *
 *   - Supabase auth: exists? confirmed? created at? last sign-in?
 *   - Prisma User: id, created at?
 *   - Workspace: created at?
 *   - Testimonials: count + how many by source (MANUAL, FORM, IMPORT…)
 *   - Widgets: count
 *   - Submissions received on their collection form
 *   - Wall Score audits: any?
 *   - Any tagged testimonials with origin:find_my_proof_search etc.
 *
 * Fast enough to run on demand: pnpm tsx scripts/check-user-activity.ts
 */

const EMAILS_FROM_ARGS = process.argv.slice(2);
const DEFAULT_EMAILS = [
  "tvmp@verizon.net",
  "ivalenzuela@jeeter.com",
  "kreike8000@gmx.de",
  "hamletter@state.gov",
  "b.e.su.j.em.a.mad54@gmail.com",
];
const EMAILS = EMAILS_FROM_ARGS.length ? EMAILS_FROM_ARGS : DEFAULT_EMAILS;

async function main() {
  const supabase = createAdminClient();

  // Paginate Supabase users so we can match by email (admin API
  // doesn't provide a per-email lookup on free tier).
  let allSupabaseUsers: Array<{
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string | null;
    email_confirmed_at?: string | null;
  }> = [];
  let page = 1;
  const perPage = 500;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("Supabase admin API error:", error.message);
      process.exit(1);
    }
    if (!data?.users?.length) break;
    allSupabaseUsers = allSupabaseUsers.concat(
      data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
      })),
    );
    if (data.users.length < perPage) break;
    page += 1;
  }

  console.log(`\n── Activity report for ${EMAILS.length} email(s) ────────\n`);

  for (const email of EMAILS) {
    const emailLower = email.toLowerCase();
    console.log(`──────────────────────────────────────────────`);
    console.log(`📧 ${email}`);

    const sb = allSupabaseUsers.find(
      (u) => u.email?.toLowerCase() === emailLower,
    );
    if (!sb) {
      console.log("   ❌ Not in Supabase auth.");
      continue;
    }

    console.log(
      `   Supabase user id:   ${sb.id}\n` +
        `   Created:            ${sb.created_at}\n` +
        `   Last sign-in:       ${sb.last_sign_in_at ?? "never"}\n` +
        `   Email confirmed:    ${sb.email_confirmed_at ? "✅" : "❌"}`,
    );

    // Prisma-side lookup.
    const dbUser = await prisma.user.findFirst({
      where: { supabaseId: sb.id },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!dbUser) {
      console.log("   ⚠️  Not provisioned in Prisma (never landed in dashboard).");
      continue;
    }

    console.log(`   Prisma user id:     ${dbUser.id}`);
    if (dbUser.workspaceMembers.length === 0) {
      console.log("   ⚠️  User has no workspace attached.");
      continue;
    }

    for (const member of dbUser.workspaceMembers) {
      const w = member.workspace;
      const [testimonials, widgets, forms, submissions, wallScoreAudits] =
        await Promise.all([
          prisma.testimonial.count({ where: { workspaceId: w.id } }),
          prisma.widget.count({ where: { workspaceId: w.id } }),
          prisma.collectionForm.count({ where: { workspaceId: w.id } }),
          prisma.submission.count({
            where: { form: { workspaceId: w.id } },
          }),
          prisma.wallScoreAudit.count({ where: { workspaceId: w.id } }),
        ]);
      console.log(
        `   Workspace:          ${w.slug}\n` +
          `     testimonials:     ${testimonials}\n` +
          `     widgets:          ${widgets}\n` +
          `     forms:            ${forms}\n` +
          `     submissions:      ${submissions}\n` +
          `     wall-score runs:  ${wallScoreAudits}`,
      );

      // Break down testimonials by source + tag if any exist.
      if (testimonials > 0) {
        const bySource = await prisma.testimonial.groupBy({
          by: ["source"],
          where: { workspaceId: w.id },
          _count: { _all: true },
        });
        console.log("     by source:");
        for (const row of bySource) {
          console.log(`       ${row.source.padEnd(14)} ${row._count._all}`);
        }

        // Origin tags — from the pending-testimonials tray flow.
        const tagged = await prisma.testimonial.findMany({
          where: {
            workspaceId: w.id,
            tags: { hasSome: ["origin:find_my_proof_search", "origin:find_my_proof_import", "origin:screenshot_tool"] },
          },
          select: { tags: true },
        });
        if (tagged.length > 0) {
          const counts: Record<string, number> = {};
          for (const t of tagged) {
            for (const tag of t.tags) {
              if (tag.startsWith("origin:")) {
                counts[tag] = (counts[tag] ?? 0) + 1;
              }
            }
          }
          console.log("     from anon tray:");
          for (const [tag, n] of Object.entries(counts)) {
            console.log(`       ${tag.padEnd(38)} ${n}`);
          }
        }
      }
    }

    console.log("");
  }

  // Diagnosis summary
  console.log(`──────────────────────────────────────────────`);
  console.log("Diagnosis:");
  console.log(
    "  Zero testimonials/widgets/forms + email unconfirmed = likely bot",
  );
  console.log(
    "  Confirmed email + 0 activity = real user that bounced (bad onboarding)",
  );
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
