import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";
import { groqChat, hasGroq, GROQ_CHAT_MODEL } from "@/lib/groq";
import { buildSystemPrompt, retrieve } from "@/lib/ask-my-wall";
import { checkAndIncrement } from "@/lib/ask-rate-limit";
import { askSubject, reserveMonthly } from "@/lib/scan-limits";

const BODY = z.object({
  question: z.string().min(2).max(500),
});

/**
 * POST /api/ask-my-wall/[workspaceSlug]
 *
 * Public endpoint hit by the embeddable widget. CORS enabled so
 * customer sites can call it. Rate-limited per-IP per-day based
 * on the workspace's AskMyWallConfig.dailyQuestionsPerIp.
 *
 * Returns { answer, references: [ { author, quote, url? } ] }
 * so the widget can render source badges under the answer.
 *
 * Plans: Pro is unlimited. Free gets a monthly allowance (see
 * PLAN_LIMITS.FREE.askMyWallAnswersPerMonth) and NEVER uses Claude:
 * answers come from Groq, and if Groq is unavailable the visitor gets
 * the closest real quotes instead of a generated sentence.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: { subscription: true, askMyWall: true },
  });
  if (!workspace) {
    return json({ error: "not_found" }, 404);
  }

  const plan = getEffectivePlan(workspace.slug, workspace.subscription?.plan);
  const limits = PLAN_LIMITS[plan];
  if (!limits.askMyWall) {
    return json({ error: "plan_required", message: "Ask My Wall is a Pro feature." }, 402);
  }

  const config = workspace.askMyWall;
  if (!config?.isActive) {
    return json({ error: "disabled", message: "This workspace hasn't enabled Ask My Wall." }, 403);
  }

  // Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const { allowed, remaining } = checkAndIncrement(ip, workspace.id, config.dailyQuestionsPerIp);
  if (!allowed) {
    return json(
      { error: "rate_limit", message: "Daily question limit reached — try again tomorrow." },
      429
    );
  }

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const testimonials = await prisma.testimonial.findMany({
    where: { workspaceId: workspace.id, status: "APPROVED", content: { not: null } },
    take: 200,
  });

  if (testimonials.length === 0) {
    return json({
      answer: "This wall doesn't have any customer testimonials yet — check back soon!",
      references: [],
      remaining,
    });
  }

  // Free workspaces have a monthly answer allowance. Counted only when
  // there is something to answer from.
  const isFree = plan === "FREE";
  if (isFree) {
    const slot = await reserveMonthly(askSubject(workspace.id), limits.askMyWallAnswersPerMonth);
    if (!slot.ok) {
      return json(
        {
          error: "quota",
          message: "This chat has reached its monthly limit. Please check back soon.",
        },
        429
      );
    }
  }

  const retrieved = retrieve(testimonials, body.question, 6);
  const systemPrompt = buildSystemPrompt(workspace.name, retrieved);

  // Groq first (free). Claude Haiku is only for Pro, and only when Groq
  // is missing or fails. Free workspaces never reach Claude.
  async function askGroq(): Promise<string> {
    const { text } = await groqChat({
      model: GROQ_CHAT_MODEL,
      max_tokens: 400,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: body.question },
      ],
    });
    return text;
  }
  async function askClaude(): Promise<string> {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: body.question }],
    });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }

  let answer = "";
  try {
    if (hasGroq()) answer = await askGroq();
    else if (!isFree) answer = await askClaude();
  } catch (err) {
    console.error("[ask-my-wall] primary LLM call failed:", err);
    if (!isFree && hasGroq() && process.env.ANTHROPIC_API_KEY) {
      try {
        answer = await askClaude();
      } catch (err2) {
        console.error("[ask-my-wall] Claude fallback failed:", err2);
      }
    }
  }

  if (!answer) {
    answer = isFree
      ? closestQuotesAnswer(retrieved)
      : "Sorry — the wall's chatbot is briefly offline. Try again in a moment.";
  }

  return json({
    answer,
    references: retrieved.slice(0, 3).map((r) => ({
      author: r.author,
      quote: r.content.slice(0, 160),
      url: r.sourceUrl,
    })),
    remaining,
  });
}

/** No LLM available: show the closest real quotes, word for word. */
function closestQuotesAnswer(
  retrieved: ReturnType<typeof retrieve>
): string {
  const top = retrieved.slice(0, 2);
  if (top.length === 0) return "I couldn't find a customer testimonial about that yet.";
  return (
    "Here is what customers have said:\n" +
    top.map((r) => `“${r.content.slice(0, 220)}” — ${r.author}`).join("\n")
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: CORS_HEADERS });
}
