import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";

/**
 * Generates ONE outreach draft for a human to review, edit, and
 * manually send — never sent automatically (spec sections 7 & 11).
 * Grounded strictly in the real evidence passed in: real praise
 * excerpts with real sources, the real social-proof verdict for
 * their site. The prompt explicitly forbids inventing anything not
 * given here, mirroring scan-report.ts's summarizeWithClaude.
 *
 * Three variants, same evidence, different angle — admin picks one
 * on the leads page before sending:
 *   wall      — current default. Observational hook, free Wall of
 *               Love signup as the ask, no pricing mentioned.
 *   hook      — opens with a direct question instead of a statement,
 *               for A/B testing open/reply rates, and states
 *               Testimoni's Pro subscription price ($9/mo) so the
 *               reader knows the paid tier upfront — free plan is
 *               still the actual CTA.
 *   paid_scan — leads with "we found public mentions of you", makes
 *               the Customer Voice report the ask (Quick Scan $9 /
 *               Deep Report $19, one-time) instead of signup.
 */
export type OutreachVariant = "wall" | "hook" | "paid_scan";

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

const VARIANT_ANGLE: Record<OutreachVariant, string> = {
  wall: "Pitch: sign up free to Testimoni and turn this scattered praise into a shareable Wall of Love widget for their site. Open with an observation, not a question. Low-pressure tone.",
  hook: "The VERY FIRST sentence must be a short, genuine, curiosity-driving QUESTION about their customer praise or reviews — not a statement. Same underlying pitch as a Wall of Love, but this time mention that Testimoni has a free plan (10 testimonials) and Pro is $9/mo for unlimited — state the $9/mo figure naturally, once, don't dwell on it. The actual ask/CTA is still to start free, not to subscribe immediately.",
  paid_scan:
    "Lead with the fact that a scan already turned up real public mentions of their product. The ask is Testimoni's Customer Voice report, not a free signup: mention explicitly that a Quick Scan (all evidence) is $9 and a Deep Report (adds AI insights, competitor mentions, export) is $19. Tone: consultative and evidence-led, not salesy — you're handing them a finding, not pitching a tool.",
};

function subjectFor(variant: OutreachVariant, productLabel: string): string {
  switch (variant) {
    case "wall":
      return `Loved what people are saying about ${productLabel}`;
    case "hook":
      return `Quick question about ${productLabel}'s customers`;
    case "paid_scan":
      return `We found public mentions of ${productLabel} — want the full list?`;
  }
}

const FALLBACK_TEMPLATE = (input: OutreachInput): string => {
  const name = input.founderName ? input.founderName.split(" ")[0] : "there";
  const product = input.productName || input.companyName;
  const firstSource = input.praiseExcerpts[0]?.source;
  const contextLine = input.extraContext ? `\n\n${input.extraContext.trim()}` : "";
  if (input.variant === "paid_scan") {
    return `Hey ${name} — we ran a scan and found people talking about ${product}${firstSource ? ` on ${firstSource}` : ""}.

Testimoni's Customer Voice report shows every public mention we found — praise, complaints, feature requests, the lot. Quick Scan (all evidence) is $9; the Deep Report adds AI insights and competitor mentions for $19.${contextLine}

Thought you'd want to see what's out there about ${product}.`;
  }
  if (input.variant === "hook") {
    return `Quick question — do you know everywhere customers have said something nice about ${product}${firstSource ? ` (we spotted one on ${firstSource})` : ""}?

It looks like some of that proof could easily get lost across different places.${contextLine}

I'm building Testimoni to help founders collect that existing praise and turn it into a shareable Wall of Love — free for up to 10 testimonials, $9/mo on Pro for unlimited.

Thought this might be relevant for ${product}.`;
  }
  return `Hey ${name} — came across ${product}${firstSource ? ` and noticed customers saying good things about it on ${firstSource}` : ""}.${contextLine}

It looks like some of that customer proof could easily get lost across different places.

I'm building Testimoni to help founders collect that existing praise and turn it into a shareable Wall of Love/widgets.

Thought this might be relevant for ${product}.`;
};

export async function generateOutreachDraft(input: OutreachInput): Promise<{ subject: string; body: string }> {
  const productLabel = input.productName || input.companyName;
  const subject = subjectFor(input.variant, productLabel);

  const hasEvidence = input.praiseExcerpts.length > 0;
  const hasContext = !!input.extraContext?.trim();
  if (!process.env.ANTHROPIC_API_KEY || (!hasEvidence && !hasContext)) {
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
      max_tokens: 400,
      system: `You write a single short, casual, personalized cold-outreach draft for a founder, pitching Testimoni. This is a DRAFT a human will review and edit before manually sending — never claim it was sent, never add a subject line or sign-off with a made-up name.

ANGLE FOR THIS DRAFT: ${VARIANT_ANGLE[input.variant]}
${!hasEvidence ? "\nNo specific customer quotes were found for this one — write a more general, consultative pitch instead of referencing praise that doesn't exist. Use the background context below for relevance/tone only." : ""}

HARD RULES
1. Use ONLY the real evidence given below. Never invent a compliment, a quote, a fact, or a detail not present in the evidence.
2. If you reference a specific piece of praise, quote or closely paraphrase ONLY from the excerpts given — never fabricate what a customer said.
3. 3-5 short sentences/paragraphs. No emoji, no exclamation-point stacking.
4. Never mention sending, DMing, emailing, or automation — just write the message text itself.
5. Never invent or state a price other than the exact figures given in the angle above (if any).
6. The "background context" section below (if present) is the admin's own notes, NOT a customer quote — never write it as if a customer said it.`,
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
