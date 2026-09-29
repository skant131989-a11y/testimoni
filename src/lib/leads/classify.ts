import { z } from "zod";
import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";
import type { ClassifiedSignal, RawCandidate } from "@/lib/leads/types";

/**
 * Semantic classification — the "not only exact keywords" step the
 * spec asks for. A provider's job is just retrieval (cast a wide
 * net); this is the only place that decides a candidate is real.
 *
 * Same hard rules as the URL-scan tool's classifier
 * (src/lib/scan-report.ts / src/app/api/scans/route.ts): copy text
 * verbatim, never invent an identity, when unsure discard rather than
 * guess. Grounding matters more here than there — this feeds
 * human-sent outreach, so a fabricated "customer said X" is worse
 * than a missed lead.
 */

// signalType and excerpt are nullable here even though ClassifiedSignal
// requires them non-null when isGenuine is true — Claude legitimately
// returns null for BOTH on every rejected (isGenuine:false) item, since
// the prompt asks for an entry per input index including rejections.
// A batch almost always mixes genuine + rejected items, and zod's array
// validation fails the WHOLE array if any one element doesn't match —
// requiring these non-null here silently discarded every batch, every
// time, with nothing logged (a safeParse failure isn't a thrown error).
// The filtering loop below re-checks isGenuine items have a real
// signalType/excerpt before using them.
const SignalSchema = z.object({
  index: z.number().int(),
  isGenuine: z.boolean(),
  signalType: z.enum(["customer_praise", "founder_seeking_proof"]).nullable(),
  companyName: z.string().nullable(),
  productName: z.string().nullable(),
  website: z.string().nullable(),
  founderName: z.string().nullable(),
  founderSocial: z.string().nullable(),
  email: z.string().nullable(),
  excerpt: z.string().nullable(),
  author: z.string().nullable(),
  category: z.string().nullable(),
});
const ResultShape = z.object({ signals: z.array(SignalSchema) });

function extractJsonObject(raw: string): string {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = stripped.indexOf("{");
  if (start === -1) return stripped;
  let depth = 0;
  let end = -1;
  let inStr = false;
  let esc = false;
  for (let i = start; i < stripped.length; i++) {
    const c = stripped[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  return end !== -1 ? stripped.slice(start, end + 1) : stripped;
}

const RULES = `For EACH numbered item below, decide if it's a genuine Testimoni lead signal:

TWO valid signal types:
  customer_praise      — a real person (not the maker) saying something genuinely positive about a SPECIFIC product they use. Vague "cool idea" comments don't count; it needs actual sentiment about using/liking the thing.
  founder_seeking_proof — the product's own founder/maker asking how to collect testimonials, mentioning they manually screenshot praise, asking about social proof/conversion, or similar — about THEIR OWN product.

REJECT (isGenuine: false) anything that is:
  - generic startup/tech chatter with no specific product being praised
  - the maker's own marketing copy/pitch (not a customer, not asking for help)
  - too vague to tell what product is being discussed
  - spam, unrelated discussion, or a homonym/unrelated use of a name

HARD RULES
1. excerpt = the exact relevant sentence(s), copied VERBATIM from the item's text. Trim to under 400 characters, never rewrite or summarize.
2. companyName/productName = only if identifiable from the text or the item's knownProductName/knownWebsite fields — never guess a name.
3. website = ONLY copy a domain that literally appears in the item's TEXT or its knownWebsite value. Even if you recognize the company/product from your own knowledge, do NOT fill in a domain you weren't given — set website: null instead. Guessing a real company's real domain is still fabrication by this rule.
4. founderName = only if an actual name is explicitly stated — otherwise null. Never infer a founder from a company name.
4a. founderSocial = ONLY a full clickable URL (e.g. "https://x.com/handle" or "https://linkedin.com/in/handle") that literally appears in the text — never a bare handle like "@name" or "name" on its own, and never construct/guess a URL from a handle. If you only see a bare handle with no URL attached, set founderSocial to null.
5. author = the real handle/name if visible in the item, else null. Never invent a person.
5a. email = a contact email address ONLY if one is literally written in the text — never invent or guess one from a name/domain.
6. category = a short product category word (e.g. "SaaS", "dev tool", "e-commerce app") only if reasonably inferable, else null.
7. When genuinely unsure, set isGenuine: false. Missing a real lead is fine; fabricating one is not.

OUTPUT — return ONLY this JSON, no fences, no prose:
{"signals":[{"index":0,"isGenuine":true,"signalType":"customer_praise","companyName":"...","productName":"...","website":"...","founderName":null,"founderSocial":null,"email":null,"excerpt":"...","author":"...","category":"..."}]}
Include an entry for EVERY input index, even rejected ones (isGenuine:false) — the caller matches by index.`;

function formatItem(i: number, c: RawCandidate): string {
  return [
    `[${i}] source=${c.source} url=${c.sourceUrl}`,
    c.author ? `author=${c.author}` : null,
    c.knownProductName ? `knownProductName=${c.knownProductName}` : null,
    c.knownWebsite ? `knownWebsite=${c.knownWebsite}` : null,
    `TEXT: ${c.text.slice(0, 800).replace(/\s+/g, " ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

interface BatchMatch {
  candidate: RawCandidate;
  signal: ClassifiedSignal;
}

/** Classifies one batch (keep batches small — ~15 items — so a
 *  single call stays fast and cheap on Haiku). Returns each accepted
 *  signal paired with the exact candidate it came from (matched by
 *  the model's own `index`, so a rejected/dropped entry never causes
 *  a positional mismatch). */
async function classifyBatch(batch: RawCandidate[]): Promise<BatchMatch[]> {
  if (batch.length === 0) return [];
  if (!process.env.ANTHROPIC_API_KEY) return [];

  const anthropic = getAnthropic();
  const itemsText = batch.map((c, i) => formatItem(i, c)).join("\n\n");

  try {
    const response = (await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 3000,
      system: `You are Testimoni's lead-qualification classifier. ${RULES}`,
      messages: [
        {
          role: "user",
          content: `Classify these ${batch.length} items:\n\n${itemsText}\n\nReturn the JSON now.`,
        },
      ],
    } as unknown as Parameters<typeof anthropic.messages.create>[0])) as unknown as {
      content: Array<{ type: string; text?: string }>;
    };

    let out = "";
    for (const block of response.content) {
      if (block.type === "text" && typeof block.text === "string") out = block.text;
    }
    if (!out) return [];
    const parsed = ResultShape.safeParse(JSON.parse(extractJsonObject(out)));
    if (!parsed.success) {
      console.warn("[leads] classify batch: response didn't match schema —", parsed.error.issues.slice(0, 3));
      return [];
    }

    const matches: BatchMatch[] = [];
    for (const s of parsed.data.signals) {
      if (!s.isGenuine) continue;
      if (s.index < 0 || s.index >= batch.length) continue;
      // signalType/excerpt are only guaranteed present when isGenuine
      // is true (see the schema comment above) — guard rather than
      // trust it, in case the model is inconsistent.
      if (!s.signalType || !s.excerpt || !s.excerpt.trim()) continue;
      matches.push({
        candidate: batch[s.index],
        signal: {
          signalType: s.signalType,
          isGenuine: true,
          companyName: s.companyName,
          productName: s.productName,
          website: s.website,
          founderName: s.founderName,
          // Defense-in-depth against a model slip (a bare handle like
          // "rooster_zeng" instead of a URL, seen in production once
          // before the rule above was tightened) — never let a
          // non-URL string reach the DB and become a broken <a href>.
          founderSocial: s.founderSocial?.startsWith("http") ? s.founderSocial : null,
          email: s.email,
          excerpt: s.excerpt.slice(0, 590),
          author: s.author,
          category: s.category,
        },
      });
    }
    return matches;
  } catch (err) {
    console.warn("[leads] classify batch failed:", err);
    return [];
  }
}

const BATCH_SIZE = 15;
const MAX_CONCURRENT_BATCHES = 3;

/** Classifies every candidate, batched, with bounded concurrency so
 *  a large scan doesn't fire dozens of simultaneous Claude calls. */
export async function classifyCandidates(
  candidates: RawCandidate[]
): Promise<{ candidate: RawCandidate; signal: ClassifiedSignal }[]> {
  const batches: RawCandidate[][] = [];
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    batches.push(candidates.slice(i, i + BATCH_SIZE));
  }

  const results: { candidate: RawCandidate; signal: ClassifiedSignal }[] = [];
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
    const slice = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
    const batchResults = await Promise.all(slice.map((batch) => classifyBatch(batch)));
    for (const matches of batchResults) results.push(...matches);
  }

  return results;
}
