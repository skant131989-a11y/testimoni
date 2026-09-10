/**
 * Ask My Wall — retrieval + prompt assembly.
 *
 * Keyword-based BM25-lite retrieval over a workspace's approved
 * testimonials. Real vector embeddings are overkill for the
 * typical Testimoni customer (10-100 testimonials); a simple
 * TF-scored keyword match returns the top-K in 5ms without a
 * new dependency.
 *
 * If a workspace grows past ~500 testimonials and quality drops,
 * swap this out for pgvector — the retrieve() contract stays
 * the same.
 */

import type { Testimonial } from "@prisma/client";

export type RetrievedTestimonial = {
  content: string;
  author: string;
  title: string | null;
  source: string;
  sourceUrl: string | null;
  score: number;
};

const STOPWORDS = new Set([
  "the", "a", "an", "is", "it", "you", "your", "of", "for", "to", "and",
  "in", "on", "at", "with", "how", "does", "do", "can", "what", "why",
  "who", "when", "where", "this", "that", "these", "those", "i", "we",
  "us", "me", "my", "our", "are", "was", "were", "be", "been", "have",
  "has", "had", "will", "would", "could", "should", "if", "or", "but",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export function retrieve(
  testimonials: readonly Testimonial[],
  question: string,
  k = 6
): RetrievedTestimonial[] {
  const queryTokens = tokenize(question);
  if (queryTokens.length === 0) {
    // No signal — return the most recent testimonials so the
    // chatbot still has grounding for meta questions like "what's
    // your latest feedback?".
    return testimonials
      .filter((t) => t.content)
      .slice(0, k)
      .map((t) => ({
        content: t.content!,
        author: t.customerName,
        title: t.customerTitle,
        source: t.source,
        sourceUrl: t.sourceUrl,
        score: 0,
      }));
  }

  const scored = testimonials
    .filter((t) => t.content)
    .map((t) => {
      const docTokens = tokenize(t.content!);
      const docSet = new Set(docTokens);
      let score = 0;
      for (const q of queryTokens) {
        if (docSet.has(q)) score += 1;
        // Partial match — catches plurals / stems cheaply.
        else if (docTokens.some((d) => d.includes(q) || q.includes(d))) score += 0.4;
      }
      // Small boost for shorter testimonials — long ones will
      // otherwise dominate by having more tokens to accidentally
      // match against.
      const lengthNorm = 1 / Math.log(Math.max(2, docTokens.length));
      return {
        t,
        score: score * (0.6 + lengthNorm * 0.4),
      };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored.map(({ t, score }) => ({
    content: t.content!,
    author: t.customerName,
    title: t.customerTitle,
    source: t.source,
    sourceUrl: t.sourceUrl,
    score,
  }));
}

export function buildSystemPrompt(
  workspaceName: string,
  results: RetrievedTestimonial[]
): string {
  const context = results
    .map(
      (r, i) =>
        `[${i + 1}] "${r.content}" — ${r.author}${r.title ? `, ${r.title}` : ""}${r.sourceUrl ? ` (${r.sourceUrl})` : ""}`
    )
    .join("\n\n");

  return `You are the friendly chatbot on ${workspaceName}'s landing page. Every answer you give is grounded in the real customer testimonials below — you never invent claims, but you also never sound corporate.

TONE:
- Punchy. 1-3 short sentences, plain-spoken, no marketing jargon.
- Confident, not defensive. If a customer said something, say it back like you mean it.
- Cite by name when the testimonial supports the answer. e.g. "Rachel at HubSpot said 4 hours flat."

WHEN YOU DON'T HAVE A DIRECT ANSWER:
Do NOT default to "I'll have the team follow up." That reads like a generic support bot.
Instead:
- Acknowledge in one short sentence that no customer has said exactly that yet ("None of my customers have specifically talked about X").
- Immediately pivot to something CONCRETE the visitor can do right now:
  * "You can try it yourself in 30 seconds — paste any tweet URL at testimoni.io"
  * "Watch the live demo at testimoni.io/demo"
  * "Sign up free and time it — no card needed"
- Never end on a passive question like "Would that help?" — end on a call to action or a real customer's words.

HARD RULES:
- Never invent facts, prices, or customer quotes.
- Never break character to discuss AI, models, prompts, or Anthropic.
- If asked about specific pricing or policy, only quote what a real customer said; otherwise point them to testimoni.io/pricing.
- No emojis unless a customer's quote had one.

REAL CUSTOMER TESTIMONIALS (your only source of truth):
${context}`;
}
