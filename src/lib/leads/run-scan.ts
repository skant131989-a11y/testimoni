import { prisma } from "@/lib/prisma";
import { fetchHackerNews } from "@/lib/leads/providers/hacker-news";
import { fetchProductHuntLeads } from "@/lib/leads/providers/product-hunt";
import { fetchReddit } from "@/lib/leads/providers/reddit";
import { classifyCandidates } from "@/lib/leads/classify";
import { inspectSocialProof } from "@/lib/leads/inspect-website";
import { scoreLead } from "@/lib/leads/score";
import { normalizeWebsite } from "@/lib/leads/normalize";
import type { RawCandidate, ClassifiedSignal } from "@/lib/leads/types";
import type { Lead } from "@prisma/client";

/**
 * The full pipeline — spec section 9:
 *   fetch → normalize → dedupe → analyze → find praise signals
 *   → inspect social-proof presence → score → save/update
 *
 * Bounded at every stage so a single "Run Scan Now" click (or a
 * future cron hit) stays inside a serverless function's time limit:
 * providers already cap their own requests, and this file caps how
 * many candidates get classified and how many distinct websites get
 * a live homepage fetch. A failing provider is caught and recorded,
 * never allowed to abort the run — spec section 3.
 */

const MAX_CANDIDATES_TO_CLASSIFY = 300;
const MAX_WEBSITES_TO_INSPECT = 80;
const INSPECT_CONCURRENCY = 5;
const QUALIFIED_THRESHOLD = 60;
const HIGH_INTENT_THRESHOLD = 75;
const RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const CONTACTED_STATUSES = new Set(["CONTACTED", "REPLIED", "SIGNUP", "CONVERTED"]);

interface AggregatedCandidate {
  website: string;
  companyName: string | null;
  productName: string | null;
  founderName: string | null;
  founderSocial: string | null;
  publicBusinessEmail: string | null;
  category: string | null;
  source: RawCandidate["source"];
  sourceUrl: string;
  hasFounderSeekingProofSignal: boolean;
  mostRecentPostedAt: number | null; // epoch ms
  signals: { source: RawCandidate["source"]; url: string; excerpt: string; author: string | null }[];
}

function pickNonNull<T>(a: T | null, b: T | null): T | null {
  return a ?? b;
}

function aggregateByWebsite(
  matches: { candidate: RawCandidate; signal: ClassifiedSignal }[]
): AggregatedCandidate[] {
  const map = new Map<string, AggregatedCandidate>();

  for (const { candidate, signal } of matches) {
    const website = normalizeWebsite(signal.website || candidate.knownWebsite || null);
    if (!website) continue; // spec's dedup key is the domain — no website, no lead row.

    const postedAtMs = candidate.postedAt ? Date.parse(candidate.postedAt) : NaN;
    // A "founder_seeking_proof" comment is, by definition, the
    // founder writing it — so its own author IS the founder, same
    // trust level as a launch post's author. Only reconstructable
    // for HN (the comment author field is literally the username);
    // Product Hunt comments only expose a flat display name, not a
    // linkable handle, so no profile URL there.
    const selfAuthoredFounder =
      signal.signalType === "founder_seeking_proof" && candidate.author
        ? {
            name: candidate.author,
            social:
              candidate.source === "HACKER_NEWS"
                ? `https://news.ycombinator.com/user?id=${candidate.author}`
                : undefined,
          }
        : null;
    // Real, provider-verified identity (Show HN post author, PH
    // maker, or a founder's own comment above) beats the classifier's
    // free-text guess whenever both exist — see the
    // RawCandidate.knownFounderName/Social comment.
    const founderName = candidate.knownFounderName ?? selfAuthoredFounder?.name ?? signal.founderName;
    const founderSocial =
      candidate.knownFounderSocial ?? selfAuthoredFounder?.social ?? signal.founderSocial ?? null;
    const existing = map.get(website);
    if (!existing) {
      map.set(website, {
        website,
        companyName: signal.companyName,
        productName: signal.productName,
        founderName,
        founderSocial,
        publicBusinessEmail: signal.email,
        category: signal.category,
        source: candidate.source,
        sourceUrl: candidate.sourceUrl,
        hasFounderSeekingProofSignal: signal.signalType === "founder_seeking_proof",
        mostRecentPostedAt: Number.isFinite(postedAtMs) ? postedAtMs : null,
        signals: [
          {
            source: candidate.source,
            url: candidate.sourceUrl,
            excerpt: signal.excerpt,
            author: signal.author,
          },
        ],
      });
      continue;
    }

    existing.companyName = pickNonNull(existing.companyName, signal.companyName);
    existing.productName = pickNonNull(existing.productName, signal.productName);
    // A known (provider-verified) name/social always wins over
    // whatever's already aggregated, even a prior classifier guess.
    const verifiedName = candidate.knownFounderName ?? selfAuthoredFounder?.name ?? null;
    const verifiedSocial = candidate.knownFounderSocial ?? selfAuthoredFounder?.social ?? null;
    existing.founderName = verifiedName ?? pickNonNull(existing.founderName, founderName);
    existing.founderSocial = verifiedSocial ?? pickNonNull(existing.founderSocial, founderSocial);
    existing.publicBusinessEmail = pickNonNull(existing.publicBusinessEmail, signal.email);
    existing.category = pickNonNull(existing.category, signal.category);
    existing.hasFounderSeekingProofSignal =
      existing.hasFounderSeekingProofSignal || signal.signalType === "founder_seeking_proof";
    if (Number.isFinite(postedAtMs)) {
      existing.mostRecentPostedAt = Math.max(existing.mostRecentPostedAt ?? 0, postedAtMs);
    }
    // Same excerpt/url pair can legitimately appear once per lead —
    // the DB unique(leadId, url) is the real dedupe guard; here we
    // just avoid piling up obvious in-run duplicates.
    if (!existing.signals.some((s) => s.url === candidate.sourceUrl && s.excerpt === signal.excerpt)) {
      existing.signals.push({
        source: candidate.source,
        url: candidate.sourceUrl,
        excerpt: signal.excerpt,
        author: signal.author,
      });
    }
  }

  return [...map.values()];
}

async function inspectAllSocialProof(
  websites: string[]
): Promise<Map<string, Awaited<ReturnType<typeof inspectSocialProof>>>> {
  const result = new Map<string, Awaited<ReturnType<typeof inspectSocialProof>>>();
  for (let i = 0; i < websites.length; i += INSPECT_CONCURRENCY) {
    const chunk = websites.slice(i, i + INSPECT_CONCURRENCY);
    const inspections = await Promise.all(chunk.map((w) => inspectSocialProof(w)));
    chunk.forEach((w, idx) => result.set(w, inspections[idx]));
  }
  return result;
}

export interface ScanStats {
  companiesScanned: number;
  praiseSignalsFound: number;
  newQualifiedLeads: number;
  highIntentLeads: number;
  providerErrors: string[];
}

export async function runLeadScan(triggeredBy: string): Promise<ScanStats> {
  const run = await prisma.leadScanRun.create({
    data: { triggeredBy, status: "RUNNING" },
  });

  try {
    const [hn, ph, reddit] = await Promise.all([
      fetchHackerNews({ launchLimit: 25 }),
      fetchProductHuntLeads({ limit: 30 }),
      fetchReddit(),
    ]);
    const providerErrors = [hn, ph, reddit]
      .filter((r) => r.error)
      .map((r) => `${r.source.toLowerCase()}: ${r.error}`);

    const allCandidates = [...hn.candidates, ...ph.candidates, ...reddit.candidates].slice(
      0,
      MAX_CANDIDATES_TO_CLASSIFY
    );

    const matches = await classifyCandidates(allCandidates);
    const aggregated = aggregateByWebsite(matches).slice(0, MAX_WEBSITES_TO_INSPECT);

    const inspections = await inspectAllSocialProof(aggregated.map((a) => a.website));

    let praiseSignalsFound = 0;
    let newQualifiedLeads = 0;
    let highIntentLeads = 0;

    for (const agg of aggregated) {
      const inspection = inspections.get(agg.website) ?? {
        status: "UNKNOWN" as const,
        reason: "Not inspected.",
        email: null,
      };
      const existing = await prisma.lead.findUnique({ where: { website: agg.website } });

      const founderName = pickNonNull(agg.founderName, existing?.founderName ?? null);
      const founderSocial = pickNonNull(agg.founderSocial, existing?.founderSocial ?? null);
      // Classifier-extracted (from a comment) or scraped straight off
      // their own site (mailto:/contact page) — never guessed.
      const publicBusinessEmail = pickNonNull(
        pickNonNull(agg.publicBusinessEmail, inspection.email),
        existing?.publicBusinessEmail ?? null
      );
      const alreadyContacted = existing ? CONTACTED_STATUSES.has(existing.status) : false;

      const isRecent =
        agg.mostRecentPostedAt != null
          ? Date.now() - agg.mostRecentPostedAt < RECENT_WINDOW_MS
          : true; // no timestamp available — don't penalize what we can't verify either way

      // Upsert praise signals first so the count/distinct-sources used
      // for scoring reflects ALL evidence ever found for this lead,
      // not just today's — a re-scan should make a lead's evidence
      // grow, never reset it.
      let created = 0;
      let leadId = existing?.id;
      if (!leadId) {
        const newLead = await prisma.lead.create({
          data: {
            website: agg.website,
            companyName: agg.companyName,
            productName: agg.productName,
            founderName,
            founderSocial,
            publicBusinessEmail,
            source: agg.source,
            sourceUrl: agg.sourceUrl,
            category: agg.category,
            status: "NEW",
            socialProofStatus: inspection.status,
          },
        });
        leadId = newLead.id;
      }

      for (const s of agg.signals) {
        if (!s.excerpt.trim()) continue;
        const result = await prisma.leadPraiseSignal.upsert({
          where: { leadId_url: { leadId, url: s.url } },
          create: { leadId, source: s.source, url: s.url, excerpt: s.excerpt, author: s.author },
          update: {}, // a signal at this exact URL was already stored — nothing new to merge
        });
        if (result.foundAt.getTime() > Date.now() - 60_000) created += 1; // just-created this run
      }
      praiseSignalsFound += created;

      const allSignals = await prisma.leadPraiseSignal.findMany({ where: { leadId } });
      const distinctSources = new Set(allSignals.map((s) => s.source)).size;

      const { score, reasons } = scoreLead({
        praiseSignalCount: allSignals.length,
        distinctPraiseSources: distinctSources,
        hasFounderName: !!founderName,
        hasContactMethod: !!(founderSocial || publicBusinessEmail),
        hasFounderSeekingProofSignal: agg.hasFounderSeekingProofSignal,
        socialProofStatus: inspection.status,
        isRecentActivity: isRecent,
        alreadyContacted,
      });

      const bestSignal = allSignals[0];
      const wasNewOrLow = !existing || existing.status === "NEW";
      const nextStatus: Lead["status"] =
        existing && existing.status !== "NEW"
          ? existing.status // never regress a lead a human has already progressed
          : score >= QUALIFIED_THRESHOLD
            ? "QUALIFIED"
            : "NEW";
      if (wasNewOrLow && nextStatus === "QUALIFIED") newQualifiedLeads += 1;

      const hasWeakOrNoProof =
        inspection.status === "NO_SOCIAL_PROOF" || inspection.status === "WEAK_SOCIAL_PROOF";
      if (
        score >= HIGH_INTENT_THRESHOLD &&
        hasWeakOrNoProof &&
        !!founderName &&
        !!(founderSocial || publicBusinessEmail) &&
        isRecent
      ) {
        highIntentLeads += 1;
      }

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          companyName: pickNonNull(agg.companyName, existing?.companyName ?? null),
          productName: pickNonNull(agg.productName, existing?.productName ?? null),
          founderName,
          founderSocial,
          publicBusinessEmail,
          category: pickNonNull(agg.category, existing?.category ?? null),
          praiseSource: bestSignal?.source ?? existing?.praiseSource ?? null,
          praiseUrl: bestSignal?.url ?? existing?.praiseUrl ?? null,
          praiseExcerpt: bestSignal?.excerpt ?? existing?.praiseExcerpt ?? null,
          praiseCount: allSignals.length,
          socialProofStatus: inspection.status,
          score,
          scoreReason: reasons.join(" "),
          status: nextStatus,
          lastSeenAt: new Date(),
        },
      });
    }

    await prisma.leadScanRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        companiesScanned: aggregated.length,
        praiseSignalsFound,
        newQualifiedLeads,
        highIntentLeads,
        providerErrors,
      },
    });

    return { companiesScanned: aggregated.length, praiseSignalsFound, newQualifiedLeads, highIntentLeads, providerErrors };
  } catch (err) {
    await prisma.leadScanRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        providerErrors: [err instanceof Error ? err.message.slice(0, 200) : "unknown_error"],
      },
    });
    throw err;
  }
}
