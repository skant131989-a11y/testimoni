import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOutreachDraft, type OutreachVariant } from "@/lib/leads/outreach";
import { leadOutreachEmailHtml } from "@/lib/emails/lead-outreach";
import { sendEmail } from "@/lib/emails/send";

/**
 * Shared sender for outreach batches (manual batch route + the daily
 * cron). Leads alternate the two templates down the list. Drafts come
 * from the deterministic template — this never calls the Anthropic API.
 * Callers are responsible for suppression/eligibility filtering.
 */
export type BatchLead = Prisma.LeadGetPayload<{ include: { praiseSignals: true } }>;

export interface BatchResult {
  website: string;
  email: string;
  variant: OutreachVariant;
  subject: string;
  body: string;
  sent: boolean;
  error?: string;
}

const VARIANTS: OutreachVariant[] = ["pro", "voice"];

export async function runOutreachBatch(leads: BatchLead[], opts: { dryRun: boolean }): Promise<BatchResult[]> {
  const results: BatchResult[] = [];

  for (const [i, lead] of leads.entries()) {
    const variant = VARIANTS[i % VARIANTS.length];
    const { subject, body } = await generateOutreachDraft({
      companyName: lead.companyName || lead.website,
      productName: lead.productName,
      founderName: lead.founderName,
      website: lead.website,
      socialProofReason: lead.socialProofStatus.replace(/_/g, " ").toLowerCase(),
      praiseExcerpts: lead.praiseSignals.slice(0, 5).map((s) => ({ source: s.source, excerpt: s.excerpt })),
      variant,
      extraContext: lead.notes,
      useClaude: false,
    });

    const email = lead.publicBusinessEmail!;
    if (opts.dryRun) {
      results.push({ website: lead.website, email, variant, subject, body, sent: false });
      continue;
    }

    const html = leadOutreachEmailHtml({
      bodyText: body,
      senderName: "Neha",
      senderEmail: "neha@testimoni.io",
      leadWebsite: lead.website,
      variant,
    });
    const sendResult = await sendEmail({
      to: email,
      subject,
      text: `${body}\n\nNot relevant? Reply "stop" and I won't email you again.`,
      html,
      replyTo: "neha@testimoni.io",
      from: "Neha from Testimoni <neha@testimoni.io>",
    });

    if (sendResult.ok) {
      await prisma.$transaction([
        prisma.leadOutreachDraft.create({
          data: { leadId: lead.id, content: `[${variant}] Subject: ${subject}\n\n${body}` },
        }),
        prisma.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } }),
      ]);
    }
    results.push({ website: lead.website, email, variant, subject, body, sent: sendResult.ok, error: sendResult.error });
  }

  return results;
}
