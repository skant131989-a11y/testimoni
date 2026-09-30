import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { normalizeWebsite } from "@/lib/leads/normalize";
import { inspectSocialProof } from "@/lib/leads/inspect-website";
import { scoreLead } from "@/lib/leads/score";

/**
 * POST /api/admin/leads/manual — the manual-outreach form's "create"
 * step. Upserts a Lead (source MANUAL) for a website the admin picks
 * themselves, rather than one a scan discovered. Runs the same
 * live website inspection a scan would (social-proof status + a
 * scraped contact email, never guessed) so a manual lead gets the
 * same quality bar. The admin's free-text "website details" goes
 * into Lead.notes — deliberately NOT a LeadPraiseSignal, so it can
 * never be mistaken for (or drafted as) a real customer quote — see
 * outreach.ts.
 *
 * Returns the lead id; the client then calls the existing
 * prepare-email → send-email flow exactly as it would for any
 * discovered lead — no new UI needed downstream of creation.
 */
const BODY = z.object({
  website: z.string().min(3).max(300),
  email: z.string().email().optional().or(z.literal("")),
  details: z.string().max(1000).optional(),
});

function nameFromWebsite(website: string): string {
  const stem = website.split(".")[0];
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let parsed: z.infer<typeof BODY>;
  try {
    parsed = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const website = normalizeWebsite(parsed.website);
  if (!website) {
    return NextResponse.json({ error: "That doesn't look like a valid website." }, { status: 400 });
  }

  const inspection = await inspectSocialProof(website);
  const email = parsed.email || inspection.email; // form value wins; else whatever we scraped

  const existing = await prisma.lead.findUnique({ where: { website } });
  const { score, reasons } = scoreLead({
    praiseSignalCount: 0,
    distinctPraiseSources: 0,
    hasFounderName: false,
    hasContactMethod: !!email,
    hasFounderSeekingProofSignal: false,
    socialProofStatus: inspection.status,
    isRecentActivity: true,
    alreadyContacted: existing ? ["CONTACTED", "REPLIED", "SIGNUP", "CONVERTED"].includes(existing.status) : false,
  });

  const lead = await prisma.lead.upsert({
    where: { website },
    create: {
      website,
      companyName: nameFromWebsite(website),
      source: "MANUAL",
      sourceUrl: `https://${website}`,
      publicBusinessEmail: email || null,
      notes: parsed.details || null,
      socialProofStatus: inspection.status,
      score,
      scoreReason: `Manually added by ${admin.email}. ${reasons.join(" ")}`,
      status: "NEW",
    },
    update: {
      publicBusinessEmail: email || existing?.publicBusinessEmail || null,
      notes: parsed.details || existing?.notes || null,
      socialProofStatus: inspection.status,
      score,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, leadId: lead.id });
}
