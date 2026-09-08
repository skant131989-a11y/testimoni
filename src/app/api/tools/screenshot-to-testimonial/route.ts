import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getAuthUser, getDbUserWithWorkspace, loadDbUserWithWorkspaceFresh } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import { SCREENSHOT_TAG, FREE_SCREENSHOT_LIMIT } from "@/lib/screenshot-constants";

/**
 * Screenshot → Testimonial (extract-only endpoint).
 *
 * Called by signed-in users only. Anonymous users on the public
 * tool page never reach this route — they pick a file, we stash
 * it in sessionStorage, and the extraction actually runs after
 * signup on the welcome page. See tools/screenshot-to-testimonial/
 * client.tsx for the anon flow.
 *
 * ─── Budget guard ──────────────────────────────────────────────
 * If ANTHROPIC_API_KEY is missing, returns 503 with reason
 * "coming_soon" so the client renders a friendly waitlist card.
 *
 * ─── Model + cost ──────────────────────────────────────────────
 * claude-sonnet-4-5-20250929 (vision-capable). ~$0.005-0.01 per
 * call depending on image size. Free-plan users get 5/mo (checked
 * against a workspace counter — TODO). Pro users unlimited.
 */

const REQUEST_SCHEMA = z.object({
  /** Data URL — data:image/png;base64,... or data:image/jpeg;base64,... */
  image: z
    .string()
    .startsWith("data:image/")
    .max(15 * 1024 * 1024),
});

const RESPONSE_SCHEMA = z.object({
  quote: z.string().min(1).max(2000),
  author: z.string().min(1).max(200),
  author_handle: z.string().max(200).optional().nullable(),
  source: z.enum([
    "twitter",
    "linkedin",
    "email",
    "slack",
    "discord",
    "whatsapp",
    "sms",
    "instagram",
    "reddit",
    "review",
    "other",
  ]),
  is_praise: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
});

/** Marker tag applied to every testimonial saved via screenshot
 *  extraction — used both to enforce the Free-plan lifetime cap
 *  and as an analytics filter. Re-exported from the shared
 *  constants file so client callers can import it too. */
export { SCREENSHOT_TAG, FREE_SCREENSHOT_LIMIT };

export async function POST(req: Request) {
  // ── Budget guard: no key → coming-soon graceful response ─────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        available: false,
        reason: "coming_soon",
        message:
          "Screenshot extraction is coming online shortly — we'll email you when it's live.",
      },
      { status: 503 },
    );
  }

  // ── Auth check: must be signed in ─────────────────────────────
  // Anonymous users hit the tool page's signup wall before ever
  // reaching this route. Reject stray anon calls with 401 so the
  // extraction budget is never spent on unauthenticated traffic.
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json(
      { error: "Sign in to run screenshot extraction." },
      { status: 401 },
    );
  }

  // ── Resolve workspace + plan ──────────────────────────────────
  // Free plan is capped at FREE_SCREENSHOT_LIMIT LIFETIME successful
  // screenshot extractions (not a monthly window — a hard total).
  // Pro is unlimited.
  const dbUser =
    (await getDbUserWithWorkspace()) ??
    (await loadDbUserWithWorkspaceFresh());
  const membership = dbUser?.workspaceMembers[0];
  if (!membership) {
    return NextResponse.json(
      { error: "No workspace found for this user." },
      { status: 400 },
    );
  }
  const workspaceId = membership.workspaceId;
  const workspaceSlug = membership.workspace.slug;
  const plan = getEffectivePlan(
    workspaceSlug,
    membership.workspace.subscription?.plan,
  );

  // ── Quota check: Free = FREE_SCREENSHOT_LIMIT total, Pro = unlimited ─
  // Counts EVERY testimonial the workspace has tagged with
  // SCREENSHOT_TAG (no date filter). Users who hit the cap must
  // upgrade to Pro to run more extractions. Deleting old
  // screenshot testimonials WILL free the slot up — acceptable
  // trade for a simple implementation.
  if (plan === "FREE") {
    const usedLifetime = await prisma.testimonial.count({
      where: {
        workspaceId,
        tags: { has: SCREENSHOT_TAG },
      },
    });
    if (usedLifetime >= FREE_SCREENSHOT_LIMIT) {
      return NextResponse.json(
        {
          available: false,
          reason: "quota_exceeded",
          message: `You've used all ${FREE_SCREENSHOT_LIMIT} free screenshot extractions. Upgrade to Pro for unlimited + multi-file upload.`,
          used: usedLifetime,
          limit: FREE_SCREENSHOT_LIMIT,
        },
        { status: 402 },
      );
    }
  }

  // ── Parse + validate body ──────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = REQUEST_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Image must be a data URL under 10MB." },
      { status: 400 },
    );
  }

  const { image } = parsed.data;

  // Extract mime + base64 from the data URL.
  const match = image.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, WEBP, or GIF images are supported." },
      { status: 400 },
    );
  }
  const [, mediaType, base64] = match;

  // ── Claude Vision call ─────────────────────────────────────────
  // Explicitly pin baseURL so the SDK ignores ANTHROPIC_BASE_URL if
  // it happens to be set in the environment (Claude Code CLI, for
  // example, sets it to a local proxy that only accepts specific
  // model IDs and would reject sonnet-4-5-2025 in dev).
  const anthropic = new Anthropic({
    apiKey,
    baseURL: "https://api.anthropic.com",
  });

  const systemPrompt = `You extract customer testimonials from screenshots. The screenshot contains praise about a product, service, person, or company — from a DM, tweet, email, Slack message, WhatsApp, Discord, LinkedIn post, App Store review, etc.

Your job:
1. Extract the exact quote text VERBATIM from the screenshot. Do not rewrite, paraphrase, or clean up typos.
2. Identify who wrote it (name and/or handle).
3. Identify what platform / app the screenshot is from (based on UI cues).
4. Judge whether the message is genuinely POSITIVE praise (is_praise=true) vs. a complaint, question, neutral message, or ambiguous (is_praise=false).
5. Assign confidence (high/medium/low) based on how clearly you can read the text and identify the author.

If the screenshot doesn't contain a message about a product/service/person, set is_praise=false and put a brief explanation in the quote field.

Return ONLY valid JSON matching this exact schema (no markdown, no commentary):
{
  "quote": string,
  "author": string,
  "author_handle": string | null,
  "source": "twitter" | "linkedin" | "email" | "slack" | "discord" | "whatsapp" | "sms" | "instagram" | "reddit" | "review" | "other",
  "is_praise": boolean,
  "confidence": "high" | "medium" | "low"
}`;

  let extraction;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Extract the testimonial from this screenshot. Return only the JSON.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }
    // Strip potential markdown code fences.
    const cleaned = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    extraction = JSON.parse(cleaned);
  } catch (err) {
    console.error("[screenshot-to-testimonial] Claude call failed", err);
    return NextResponse.json(
      { error: "Extraction failed. Try a clearer screenshot." },
      { status: 500 },
    );
  }

  const validated = RESPONSE_SCHEMA.safeParse(extraction);
  if (!validated.success) {
    console.error(
      "[screenshot-to-testimonial] Claude returned invalid shape",
      extraction,
    );
    return NextResponse.json(
      { error: "Couldn't parse the extraction. Try again." },
      { status: 500 },
    );
  }

  const testimonial = validated.data;

  // If Claude decided this isn't praise, tell the user politely so
  // they don't get a "Save to my wall" prompt on a support ticket.
  if (!testimonial.is_praise) {
    return NextResponse.json({
      available: true,
      is_praise: false,
      quote: testimonial.quote,
      confidence: testimonial.confidence,
      message:
        "This doesn't look like customer praise — try a screenshot with a positive quote.",
    });
  }

  // ── Return the extraction ─────────────────────────────────────
  return NextResponse.json({
    available: true,
    is_praise: true,
    quote: testimonial.quote,
    author: testimonial.author,
    author_handle: testimonial.author_handle ?? null,
    source: testimonial.source,
    confidence: testimonial.confidence,
  });
}
