import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";
import { groqChat, hasGroq, GROQ_CHAT_MODEL } from "@/lib/groq";
import { buildSystemPrompt, retrieve } from "@/lib/ask-my-wall";
import { checkAndIncrement } from "@/lib/ask-rate-limit";

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

  let body;
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

  const retrieved = retrieve(testimonials, body.question, 6);
  const systemPrompt = buildSystemPrompt(workspace.name, retrieved);

  // Prefer Groq (free) when the key is available; fall back to
  // Claude Haiku. Both models handle this workload well; the
  // system prompt is provider-agnostic.
  let answer: string;
  try {
    if (hasGroq()) {
      const { text } = await groqChat({
        model: GROQ_CHAT_MODEL,
        max_tokens: 400,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: body.question },
        ],
      });
      answer = text || "Sorry, I couldn't come up with an answer for that.";
    } else {
      const anthropic = getAnthropic();
      const response = await anthropic.messages.create({
        model: CHAT_MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: body.question }],
      });
      const block = response.content[0];
      answer =
        block.type === "text"
          ? block.text
          : "Sorry, I couldn't come up with an answer for that.";
    }
  } catch (err) {
    console.error("[ask-my-wall] LLM call failed:", err);
    answer = "Sorry — the wall's chatbot is briefly offline. Try again in a moment.";
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
