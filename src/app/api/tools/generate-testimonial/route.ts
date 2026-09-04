import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tools/generate-testimonial
 *
 * Public tool endpoint — no auth required, IP-rate-limited elsewhere
 * if needed. Currently returns template-driven mock variations so the
 * UI works end-to-end without a paid LLM key. To swap for a real LLM:
 *
 *   1. Add ANTHROPIC_API_KEY to env
 *   2. Replace the `buildVariants` call below with an Anthropic call
 *   3. Keep the response shape identical so the client stays the same
 *
 * The templates below are intentionally short and generic — the goal
 * is a working SEO-indexable page today, not perfect copy.
 */

type Feeling =
  | "impressed"
  | "grateful"
  | "transformed"
  | "saved_time"
  | "saved_money";
type Tone = "casual" | "professional" | "enthusiastic";
type Length = "short" | "medium" | "long";

interface Body {
  reviewingName?: string;
  role?: string;
  didWhat?: string;
  feeling?: Feeling;
  tone?: Tone;
  length?: Length;
  yourName?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const reviewingName = (body.reviewingName || "").trim().slice(0, 80);
  const didWhat = (body.didWhat || "").trim().slice(0, 300);
  const feeling: Feeling = body.feeling || "impressed";
  const tone: Tone = body.tone || "casual";
  const length: Length = body.length || "medium";

  if (!reviewingName || !didWhat) {
    return NextResponse.json(
      { error: "reviewingName and didWhat are required" },
      { status: 400 }
    );
  }

  const variants = buildVariants({ reviewingName, didWhat, feeling, tone, length });
  return NextResponse.json({ variants }, { status: 200 });
}

/**
 * Build 3 testimonial variations from templates. Each variation has a
 * distinct angle:
 *   1. Outcome-first (numbers / concrete result)
 *   2. Emotion-first (feeling + relationship)
 *   3. Recommendation-first (would-you-recommend framing)
 *
 * Templates interpolate the user's inputs. When swapped for an LLM,
 * the same 3 angles become 3 prompts.
 */
function buildVariants(opts: {
  reviewingName: string;
  didWhat: string;
  feeling: Feeling;
  tone: Tone;
  length: Length;
}) {
  const { reviewingName, didWhat, feeling, tone, length } = opts;

  const feelingWords: Record<Feeling, string> = {
    impressed: "genuinely impressed",
    grateful: "so grateful",
    transformed: "completely changed how I work",
    saved_time: "saved me hours every week",
    saved_money: "paid for itself in the first month",
  };
  const toneOpener: Record<Tone, string[]> = {
    casual: ["Honestly,", "Look —", "Real talk:"],
    professional: [
      "I recently worked with",
      "I had the pleasure of engaging",
      "My experience with",
    ],
    enthusiastic: [
      "I cannot say enough about",
      "Absolutely blown away by",
      "Zero hesitation recommending",
    ],
  };
  const openers = toneOpener[tone];

  // Outcome-first
  const v1Short = `${reviewingName} ${didWhat}. ${capitalize(feelingWords[feeling])}. Would work with them again in a heartbeat.`;
  const v1Medium = `${openers[0]} ${reviewingName} ${didWhat}. I was ${feelingWords[feeling]} — the whole thing was faster and cleaner than I expected. If you're on the fence, don't be.`;
  const v1Long = `${openers[0]} ${reviewingName} ${didWhat}. Coming in I was skeptical, but I was ${feelingWords[feeling]} by how the whole thing came together. Communication was clear, deadlines were hit, and the final result exceeded what I had in mind. If you're weighing options and wondering whether it's worth it, this is your sign.`;

  // Emotion-first
  const v2Short = `Working with ${reviewingName} was one of the best decisions I made this year. ${didWhat}, and I'm ${feelingWords[feeling]}.`;
  const v2Medium = `${openers[1]} ${reviewingName}. They ${didWhat} — and honestly, I'm still ${feelingWords[feeling]}. What I loved most was how much they cared about getting it right, not just getting it done.`;
  const v2Long = `${openers[1]} ${reviewingName} — and it was easily one of the best decisions I've made this year. They ${didWhat}. Beyond the work itself, what stood out was the care: every question answered, every detail thought through, every deadline respected. I'm ${feelingWords[feeling]}, and I'd hire them again without a second thought.`;

  // Recommendation-first
  const v3Short = `Would I recommend ${reviewingName}? Without hesitation. ${capitalize(didWhat)} and left me ${feelingWords[feeling]}.`;
  const v3Medium = `${openers[2]} ${reviewingName}. They ${didWhat} and left me ${feelingWords[feeling]}. If you're reading this and wondering — just book the call. You won't regret it.`;
  const v3Long = `${openers[2]} ${reviewingName} to anyone considering them. They ${didWhat} and left me ${feelingWords[feeling]}. If you're reading this trying to figure out whether it's worth it, take this as your sign: it is. Excellent work, real communication, and no drama. That's a rare combination.`;

  const pick = <T,>(short: T, medium: T, long: T): T =>
    length === "short" ? short : length === "long" ? long : medium;

  return [
    { angle: "Outcome-first", text: pick(v1Short, v1Medium, v1Long) },
    { angle: "Emotion-first", text: pick(v2Short, v2Medium, v2Long) },
    { angle: "Recommendation-first", text: pick(v3Short, v3Medium, v3Long) },
  ];
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
