import Anthropic from "@anthropic-ai/sdk";

/**
 * Shared Anthropic client factory.
 *
 * Explicitly pins baseURL so the SDK ignores ANTHROPIC_BASE_URL if
 * it happens to be set in the environment (Claude Code CLI, for
 * example, sets it to a local proxy that only accepts specific
 * model IDs and would reject production ones in dev).
 */
export function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });
}

// Fast + cheap model for high-volume features (Ask My Wall chat,
// tweet drafts, weekly recommendations). Vision-grade Sonnet is
// only used where images matter (screenshot extractor).
export const CHAT_MODEL = "claude-haiku-4-5-20251001";
