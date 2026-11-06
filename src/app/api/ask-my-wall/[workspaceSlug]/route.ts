import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";
import { groqChat, hasGroq, GROQ_CHAT_MODEL } from "@/lib/groq";
import { buildSystemPrompt, localAnswer, retrieve } from "@/lib/ask-my-wall";
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
 * Plans: Pro is unlimited and gets AI-written answers (Groq first,
 * Claude Haiku if Groq fails). Free gets a monthly allowance (see
 * PLAN_LIMITS.FREE.askMyWallAnswersPerMonth) and uses no AI at all: the
 * answer is built locally from the closest real quotes (localAnswer).
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

  // Pro: AI-written answer (Groq first, Claude Haiku if Groq fails).
  // Free: no AI call; the answer is built locally from the quotes.
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
  if (!isFree) {
    try {
      answer = hasGroq() ? await askGroq() : await askClaude();
    } catch (err) {
      console.error("[ask-my-wall] primary LLM call failed:", err);
      if (hasGroq() && process.env.ANTHROPIC_API_KEY) {
        try {
          answer = await askClaude();
        } catch (err2) {
          console.error("[ask-my-wall] Claude fallback failed:", err2);
        }
      }
    }
  }
  if (!answer) answer = localAnswer(body.question, retrieved);

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
