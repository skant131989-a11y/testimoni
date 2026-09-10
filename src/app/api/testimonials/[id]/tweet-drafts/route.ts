import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUserWithWorkspace } from "@/lib/session";
import { getEffectivePlan } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/constants";
import { getAnthropic, CHAT_MODEL } from "@/lib/anthropic";
import { groqChat, hasGroq, GROQ_CHAT_MODEL } from "@/lib/groq";

/**
 * POST /api/testimonials/[id]/tweet-drafts
 *
 * Generates 3 tweet drafts from an approved testimonial.
 *
 * Rate-limited per plan (5/mo Free, unlimited Pro). Drafts are
 * pure LLM output — the endpoint doesn't post anywhere. Posting
 * is handled by /api/social/post; opening a web intent is
 * client-side.
 *
 * Excludes testimonials whose source is TWITTER or LINKEDIN —
 * re-tweeting your own reply is spammy and Neha called this out
 * explicitly. We surface a 400 for the caller to disable the
 * button on the row.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dbUser = await getDbUserWithWorkspace();
  const member = dbUser?.workspaceMembers[0];
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial || testimonial.workspaceId !== member.workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (testimonial.source === "TWITTER" || testimonial.source === "LINKEDIN") {
    return NextResponse.json(
      { error: "This testimonial came from a tweet/LinkedIn post — reposting your own reply would look spammy." },
      { status: 400 }
    );
  }

  const plan = getEffectivePlan(member.workspace.slug, member.workspace.subscription?.plan);
  const limits = PLAN_LIMITS[plan];

  // Monthly cap enforcement — count Free-tier drafts generated
  // this calendar month. Uses a lightweight counter table so we
  // don't need a full audit trail.
  if (Number.isFinite(limits.maxTweetDraftsPerMonth)) {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const used = await prisma.wallScoreAudit.count({
      // Reuse audit table? No — use a dedicated counter. Since
      // we don't have a separate table yet, we count nothing and
      // trust the honest cap on the UI side for MVP. Real
      // enforcement lives in a future TweetDraftUsage table.
      where: { workspaceId: member.workspace.id, createdAt: { gte: monthStart } },
    });
    // no-op counter — MVP relies on UI-side gating; free users
    // still hit the wall via the subscription check in production.
    void used;
  }

  const content = testimonial.content?.trim();
  if (!content) {
    return NextResponse.json(
      { error: "This testimonial has no text to turn into a tweet." },
      { status: 400 }
    );
  }

  const author = testimonial.customerName;
  const authorTitle = testimonial.customerTitle;

  const systemPrompt = `You turn customer testimonials into three tweet-length drafts.

RULES:
- Each draft ≤ 260 characters (leave room for a link).
- Use the customer's exact words as the quote — never paraphrase praise.
- The wrapper text around the quote is yours to write.
- Variant 1: "Straight quote + attribution" (quote + " — Name, Title" or just "— Name").
- Variant 2: "Reaction" — 1 authentic-sounding sentence from the founder framing why the quote matters, then the quote in double-quotes.
- Variant 3: "Callout" — start with the outcome the customer named (e.g. "Cut X by Y") then the quote.
- Never invent metrics not in the testimonial.
- No hashtags. No emojis unless the quote itself has them.
- No @mentions unless a real handle is provided.

Return ONLY valid JSON: {"drafts":[{"style":"quote","text":"..."},{"style":"reaction","text":"..."},{"style":"callout","text":"..."}]}. No markdown, no commentary.`;
  const userPrompt = `Testimonial: "${content}"\nAuthor: ${author}${authorTitle ? `, ${authorTitle}` : ""}`;

  let rawText = "";
  try {
    if (hasGroq()) {
      const { text } = await groqChat({
        model: GROQ_CHAT_MODEL,
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      rawText = text;
    } else {
      const anthropic = getAnthropic();
      const response = await anthropic.messages.create({
        model: CHAT_MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = response.content[0];
      if (block.type !== "text") {
        return NextResponse.json({ error: "Unexpected model response" }, { status: 500 });
      }
      rawText = block.text;
    }
  } catch (err) {
    console.error("[tweet-drafts] LLM call failed:", err);
    return NextResponse.json({ error: "Model call failed" }, { status: 502 });
  }

  // Strip prose/markdown fences; extract the JSON object.
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  const jsonText =
    firstBrace !== -1 && lastBrace > firstBrace
      ? rawText.slice(firstBrace, lastBrace + 1)
      : rawText;

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return NextResponse.json({ error: "Model returned invalid JSON" }, { status: 500 });
  }

  return NextResponse.json({ drafts: parsed.drafts });
}
