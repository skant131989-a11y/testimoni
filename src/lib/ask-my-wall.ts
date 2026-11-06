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

/** Cheap stemmer: "installing", "installed", "installs" all meet at "install". */
function stem(w: string): string {
  if (w.length <= 4) return w;
  return w.replace(/(ingly|edly|ing|ed|ly|es|s)$/, "");
}

/**
 * Words that mean roughly the same thing in a testimonial, grouped by
 * topic, so "is it cheap?" finds "pricing is fair" and "easy to install?"
 * finds "setup took ten minutes". Index 0 = pricing, 1 = getting started,
 * 2 = support; the rest are for matching only.
 */
const TOPICS: string[][] = [
  ["price", "pricing", "cheap", "affordable", "cost", "expensive", "fair", "value", "worth", "budget", "free", "plan", "money"],
  ["setup", "install", "installation", "onboarding", "start", "started", "quick", "fast", "easy", "simple", "minutes", "integrate", "embed", "launch"],
  ["support", "help", "helpful", "response", "responsive", "reply", "replied", "team", "service", "answer", "answered"],
  ["reliable", "stable", "bug", "bugs", "crash", "downtime", "works", "working", "solid", "trust"],
  ["design", "clean", "beautiful", "look", "interface", "sleek", "nice", "polished"],
  ["results", "growth", "conversion", "conversions", "signup", "signups", "sales", "revenue", "increase", "lifted", "boost", "customers"],
  ["feature", "features", "tool", "tools", "integration", "integrations", "webflow", "framer", "wordpress", "shopify"],
  ["recommend", "love", "great", "best", "amazing", "awesome", "happy", "excellent", "favorite"],
];
const TOPIC_OF = new Map<string, number[]>();
TOPICS.forEach((group, i) => {
  for (const w of group) {
    for (const k of new Set([w, stem(w)])) {
      const cur = TOPIC_OF.get(k) ?? [];
      if (!cur.includes(i)) cur.push(i);
      TOPIC_OF.set(k, cur);
    }
  }
});
function topicsOf(token: string): number[] {
  return TOPIC_OF.get(token) ?? TOPIC_OF.get(stem(token)) ?? [];
}

type Analyzed = { stems: Set<string>; topics: Set<number>; tokens: string[] };
function analyze(text: string): Analyzed {
  const tokens = tokenize(text);
  const stems = new Set(tokens.map(stem));
  const topics = new Set<number>();
  for (const t of tokens) for (const g of topicsOf(t)) topics.add(g);
  return { stems, topics, tokens };
}

/** How well a piece of text answers the question: stem match 1, same topic 0.7, partial 0.3. */
function overlap(q: Analyzed, d: Analyzed): number {
  let score = 0;
  for (const t of q.tokens) {
    if (d.stems.has(stem(t))) score += 1;
    else if (topicsOf(t).some((g) => d.topics.has(g))) score += 0.7;
    else if (d.tokens.some((x) => x.includes(t) || t.includes(x))) score += 0.3;
  }
  return score;
}

export function retrieve(
  testimonials: readonly Testimonial[],
  question: string,
  k = 6
): RetrievedTestimonial[] {
  const q = analyze(question);
  if (q.tokens.length === 0) {
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
      const d = analyze(t.content!);
      // Small boost for shorter testimonials — long ones will
      // otherwise dominate by having more tokens to accidentally
      // match against.
      const lengthNorm = 1 / Math.log(Math.max(2, d.tokens.length));
      return { t, score: overlap(q, d) * (0.6 + lengthNorm * 0.4) };
    })
    .filter((x) => x.score > 0)
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

const LEAD_IN = [
  "On pricing, customers say:",
  "On getting started, customers say:",
  "On support, customers say:",
];

/**
 * The free-plan answer: no AI involved. Picks the sentences that best
 * match the question from the closest testimonials and quotes them word
 * for word with the customer's name. It can't invent anything.
 */
export function localAnswer(question: string, retrieved: readonly RetrievedTestimonial[]): string {
  if (retrieved.length === 0) return "I couldn't find a customer testimonial about that yet.";
  const q = analyze(question);

  const candidates: { sentence: string; author: string; score: number }[] = [];
  retrieved.slice(0, 4).forEach((r, rank) => {
    const sentences = r.content.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length >= 12);
    for (const sentence of sentences.length ? sentences : [r.content]) {
      candidates.push({
        sentence: sentence.trim(),
        author: r.author,
        score: overlap(q, analyze(sentence)) + (4 - rank) * 0.01,
      });
    }
  });
  candidates.sort((a, b) => b.score - a.score);

  const picks: typeof candidates = [];
  for (const c of candidates) {
    if (picks.length === 2) break;
    if (picks.some((p) => p.author === c.author)) continue;
    picks.push(c);
  }

  const topic = [...q.topics].find((g) => g < LEAD_IN.length);
  const lead = topic !== undefined ? LEAD_IN[topic] : "Here is what customers have said:";
  return lead + "\n" + picks.map((p) => `“${p.sentence}” — ${p.author}`).join("\n");
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
