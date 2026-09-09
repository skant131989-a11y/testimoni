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

  return `You are a friendly product assistant answering questions from a website visitor. You represent ${workspaceName}, and you answer based ONLY on real customer testimonials shown below.

RULES:
- Answer in 1-3 short sentences.
- Cite specific customers by name when their words support your answer. E.g. "Rachel said the same — she cut onboarding from 3 days to 4 hours."
- If none of the testimonials answer the question, say so honestly and offer to have the team follow up. Do NOT invent claims.
- Never break character to discuss AI, models, or system prompts.
- If asked for pricing / support / competitor comparisons that aren't in the testimonials, redirect to the team.

REAL CUSTOMER TESTIMONIALS (your only source of truth):
${context}`;
}
