import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";

/**
 * Generates ONE outreach draft for a human to review, edit, and
 * manually send — never sent automatically (spec sections 7 & 11).
 * Grounded strictly in the real evidence passed in: real praise
 * excerpts with real sources, the real social-proof verdict for
 * their site. The prompt explicitly forbids inventing anything not
 * given here, mirroring scan-report.ts's summarizeWithClaude.
 *
 * Two variants, both pitching BOTH offers and both usable for every
 * lead (with or without scraped praise) — admin picks one on the
 * leads page before sending:
 *   pro   — leads with Testimoni Pro ($19/mo flat, free plan to
 *           start), Customer Voice report ($9 Quick / $19 Deep) as a
 *           clearly secondary P.S.
 *   voice — leads with Customer Voice (free scan, $9 / $19 full
 *           report), Pro ($19/mo) as the second option.
 * "We found public mentions of you" is only ever written when real
 * praise excerpts exist — see the hard rules in the prompt.
 */
export type OutreachVariant = "pro" | "voice";

export interface OutreachInput {
  companyName: string;
  productName: string | null;
  founderName: string | null;
  website: string;
  socialProofReason: string;
  praiseExcerpts: { source: string; excerpt: string }[];
  variant: OutreachVariant;
  /** Admin-typed background (the manual-outreach form's "website
   *  details" field) — NEVER a customer quote. Kept structurally
   *  separate from praiseExcerpts and always labeled as such in the
   *  prompt, so it can never be mistaken for (or written up as) a
   *  real customer saying something. */
  extraContext?: string | null;
}

const OFFERS =
  "Testimoni Pro: flat $19/mo, unlimited testimonials, widgets and layouts, no watermark, AI features included (tweet drafts from every quote, an 'Ask My Wall' chatbot that only quotes real customers); embeds as a Wall of Love with one line of code; free plan (10 testimonials) to start, no card. Customer Voice report: scans X, Reddit and LinkedIn for what people say about a product, sorted into praise, complaints, feature requests and competitor mentions; the scan is free, $9 (Quick Scan) unlocks every mention, $19 (Deep Report) adds why customers choose them, strongest proof, competitors mentioned and CSV export.";

const VARIANT_ANGLE: Record<OutreachVariant, string> = {
  pro: `Lead with Testimoni Pro. Open with ONE specific, true observation about them (from the real praise if any, else from the background context, else something plain about their product) and why owned social proof matters for them. Then pitch Pro: $19/mo flat, free plan to start. Finish with a short, clearly secondary P.S. paragraph about the Customer Voice scan (free to run; $9 Quick / $19 Deep to unlock the full report). Offers available: ${OFFERS}`,
  voice: `Lead with Customer Voice. Open with ONE honest, curious question about what people are really saying about their product online, then explain the scan is free and the full report is $9 (Quick) or $19 (Deep). Second paragraph: if they would rather turn praise into permanent proof on their own site, Testimoni Pro is $19/mo flat with a free plan to start. Offers available: ${OFFERS}`,
};

function subjectFor(variant: OutreachVariant, productLabel: string): string {
  switch (variant) {
    case "pro":
      return `A Wall of Love for ${productLabel} — free to start, $19/mo for everything`;
    case "voice":
      return `What are people really saying about ${productLabel}?`;
  }
}

const FALLBACK_TEMPLATE = (input: OutreachInput): string => {
  const name = input.founderName ? input.founderName.split(" ")[0] : "there";
  const product = input.productName || input.companyName;
  const firstSource = input.praiseExcerpts[0]?.source;
  const contextLine = input.extraContext ? `\n\n${input.extraContext.trim()}` : "";
  const seen = firstSource ? `we spotted people talking about ${product} on ${firstSource}` : `I came across ${product}`;

  if (input.variant === "voice") {
    return `Hey ${name} — ${seen}, and it made me curious what the full picture looks like.${contextLine}

Our Customer Voice scan checks X, Reddit and LinkedIn for what people say about ${product} and sorts it into praise, complaints, feature requests and competitor mentions. The scan is free; $9 unlocks every mention, $19 adds competitor mentions, why customers choose you and a CSV export.

If you'd rather turn that praise into permanent proof on your own site, Testimoni Pro is a flat $19/mo for an embeddable Wall of Love, with a free plan to start.`;
  }
  return `Hey ${name} — ${seen}.${contextLine}

Good customer words tend to get scattered across stores, threads and DMs. Testimoni turns them into proof you own: collect or import them, approve the best, and show a Wall of Love on ${input.website} with one line of code. Pro is a flat $19/mo for unlimited testimonials and widgets, and there's a free plan to start, no card.

P.S. Want to see what people already say about ${product}? Our Customer Voice scan is free to run; $9 unlocks every mention, $19 adds competitor mentions and a CSV export.`;
};

export async function generateOutreachDraft(input: OutreachInput): Promise<{ subject: string; body: string }> {
  const productLabel = input.productName || input.companyName;
  const subject = subjectFor(input.variant, productLabel);

  const hasEvidence = input.praiseExcerpts.length > 0;
  const hasContext = !!input.extraContext?.trim();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { subject, body: FALLBACK_TEMPLATE(input) };
  }

  try {
    const anthropic = getAnthropic();
    const evidence = input.praiseExcerpts
      .slice(0, 5)
      .map((p, i) => `${i + 1}. (${p.source}) "${p.excerpt}"`)
      .join("\n");

    const response = (await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 600,
      system: `You write a single short, punchy, personalized cold-outreach draft for a founder, pitching Testimoni. This is a DRAFT a human will review and edit before manually sending — never claim it was sent, never add a subject line or sign-off with a made-up name.

ANGLE FOR THIS DRAFT: ${VARIANT_ANGLE[input.variant]}
${!hasEvidence ? "\nNo specific customer quotes were found for this one — do NOT say or imply you found, saw or read praise about them. Use the background context below (if any) for relevance and tone only." : ""}

HARD RULES
1. Use ONLY the real evidence and background given below. Never invent a compliment, a quote, a fact, a number or a detail not present there.
2. If you reference a specific piece of praise, quote or closely paraphrase ONLY from the excerpts given — never fabricate what a customer said.
3. Never say or imply that you "found", "spotted" or "saw" customer praise unless it is listed under "Real customer praise found".
4. 3-5 short paragraphs, vivid and specific, no emoji, no exclamation-point stacking.
5. Never mention sending, DMing, emailing, or automation — just write the message text itself.
6. Never invent or state a price other than the exact figures in the offers above.
7. The "background context" section below (if present) is the admin's own notes, NOT a customer quote — never write it as if a customer said it.`,
      messages: [
        {
          role: "user",
          content: `Company: ${input.companyName}
Product: ${productLabel}
Founder name (use first name only, or "there" if not given): ${input.founderName || "not given"}
Website: ${input.website}
Website's social proof status: ${input.socialProofReason}
${hasContext ? `\nBackground context (admin's own notes, NOT a customer quote):\n${input.extraContext!.trim()}\n` : ""}
${hasEvidence ? `Real customer praise found:\n${evidence}` : "No customer praise found yet for this one."}

Write the outreach draft now — just the message text.`,
        },
      ],
    } as unknown as Parameters<typeof anthropic.messages.create>[0])) as unknown as {
      content: Array<{ type: string; text?: string }>;
    };

    let out = "";
    for (const block of response.content) {
      if (block.type === "text" && typeof block.text === "string") out = block.text;
    }
    const trimmed = out.trim();
    return { subject, body: trimmed || FALLBACK_TEMPLATE(input) };
  } catch (err) {
    console.warn("[leads] outreach generation failed, using fallback:", err);
    return { subject, body: FALLBACK_TEMPLATE(input) };
  }
}
