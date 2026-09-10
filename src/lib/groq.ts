/**
 * Minimal Groq client using fetch — no npm dep needed.
 *
 * Groq is OpenAI-compatible. Two flavors of models we care about:
 *
 * 1. Regular chat: llama-3.3-70b-versatile, llama-3.1-8b-instant, etc.
 *    Use for Ask My Wall, tweet drafts — anything without web search.
 *
 * 2. Compound models (groq/compound, groq/compound-mini): agentic
 *    models with built-in web search + code execution. Free during
 *    beta. Use this for Find My Proof as the "free" alternative to
 *    Claude's web_search tool.
 *
 * Set GROQ_API_KEY in .env.local to enable. If not set, callers
 * should fall back to Anthropic.
 */

export const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

// Default chat model — free tier of Groq varies per account. As
// of 2026-09 the free tier on this project's key includes
// qwen/qwen3.8-27b, openai/gpt-oss-120b, openai/gpt-oss-20b —
// but NOT any Llama variant. We default to Qwen because the
// gpt-oss models are reasoning-first and often spend the token
// budget on internal thinking, returning empty content. Override
// via GROQ_CHAT_MODEL.
export const GROQ_CHAT_MODEL =
  process.env.GROQ_CHAT_MODEL || "qwen/qwen3.8-27b";

// Compound models bundle web search + reasoning. NOTE: free tier
// on some accounts 413s these models regardless of payload size
// (Groq gates web-search behind a paid plan). Call sites should
// check hasGroqCompound() before relying on this for search.
export const GROQ_COMPOUND_MODEL =
  process.env.GROQ_COMPOUND_MODEL || "groq/compound-mini";

export function hasGroq(): boolean {
  return !!process.env.GROQ_API_KEY;
}

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqCallOpts {
  model: string;
  messages: GroqMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface GroqResponseChoice {
  message?: { content?: string | null };
}
interface GroqResponse {
  choices?: GroqResponseChoice[];
  // Compound models attach the sources they hit in `executed_tools`.
  // Shape is not officially frozen — treat as best-effort.
  choices_?: unknown;
}

export async function groqChat(opts: GroqCallOpts): Promise<{ text: string; raw: GroqResponse }> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      max_tokens: opts.max_tokens ?? 1500,
      temperature: opts.temperature ?? 0.3,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as GroqResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  return { text, raw: data };
}
